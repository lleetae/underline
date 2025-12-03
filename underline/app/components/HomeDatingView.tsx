
import React, { useState, useEffect } from "react";
import { MapPin, Bell } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { supabase } from "../lib/supabase";
import { useCountdown } from "../hooks/useCountdown";
import { BatchUtils } from "../utils/BatchUtils";
import { subDays } from "date-fns";

interface UserProfile {
  id: number; // Changed from string to number
  nickname: string;
  age: number;
  location: string;
  photos: string[];
  bio: string;
  bookTitle: string;
  bookReview: string;
  reviewExcerpt: string;
  isPenalized: boolean;
}

export function HomeDatingView({ onProfileClick, isSignedUp, onShowNotifications, isSpectator = false, onRegister }: {
  onProfileClick?: (profileId: string, source?: "home" | "mailbox", metadata?: { isPenalized?: boolean }) => void;
  isSignedUp?: boolean;
  onShowNotifications?: () => void;
  isSpectator?: boolean;
  onRegister?: () => void;
}) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSpectatorPopup, setShowSpectatorPopup] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check for Welcome Modal flag
  useEffect(() => {
    if (sessionStorage.getItem('showWelcomeModal') === 'true') {
      setShowWelcomeModal(true);
    }
  }, []);

  // Show spectator popup on mount if isSpectator is true
  useEffect(() => {
    setShowSpectatorPopup(isSpectator);
  }, [isSpectator]);

  // const supabase = createClient(); // Removed local client creation

  // Countdown timer for dating period end (Next Monday 00:00)
  // The useCountdown hook takes (targetDayOfWeek: number, targetHour: number)
  // 1 for Monday, 0 for Sunday. So 1, 0 means Monday 00:00.
  const timeLeft = useCountdown(1, 0);

  // Calculate total hours for display (e.g. 36:00:00)
  const totalHours = timeLeft.days * 24 + timeLeft.hours;

  // Removed manual calculateTimeLeft and its useEffect

  // Fetch unread notification count with short polling (5 seconds)
  useEffect(() => {
    if (!isSignedUp) return;

    // Initial fetch
    fetchUnreadCount();

    // Poll every 5 seconds for near-real-time updates
    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  }, [isSignedUp]);

  const fetchUnreadCount = async () => {
    try {
      // Refresh session to prevent stale session issues
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

      if (sessionError || !session) {
        console.error("Session refresh failed:", sessionError);
        return;
      }

      const token = session.access_token;
      const response = await fetch('/api/notifications?unread_only=true', {
        headers: {
          'Authorization': `Bearer ${token} `
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Fetch current user's gender using auth_id
        const { data: currentUserData } = await supabase
          .from('member')
          .select('id, gender')
          .eq('auth_id', user.id)
          .single();

        const myGender = currentUserData?.gender;
        const myMemberId = currentUserData?.id;

        // 1. Determine Current Batch Range
        // We only want candidates who applied for THIS batch.
        const currentBatchDate = BatchUtils.getCurrentBatchStartDate();
        const { start, end } = BatchUtils.getBatchApplicationRange(currentBatchDate);

        // 2. Fetch candidates (excluding myself) and filter by dating_applications existence in range
        let query = supabase
          .from('member')
          .select(`
            id,
            nickname,
            age,
            birth_date,
            location,
            photo_url,
            photos,
            bio,
            gender,
            member_books(
              book_title,
              book_review,
              created_at
            ),
            dating_applications!inner(
              created_at
            )
          `)
          .gte('dating_applications.created_at', start.toISOString())
          .lte('dating_applications.created_at', end.toISOString())
          .eq('dating_applications.status', 'active') // Only show active applications
          .not('auth_id', 'is', null); // Exclude withdrawn members

        if (myMemberId) {
          query = query.neq('id', myMemberId);
        }

        if (myGender) {
          // Filter for opposite gender
          query = query.neq('gender', myGender);
        }

        const { data, error } = await query.limit(50); // Fetch more to handle sorting

        if (error) throw error;

        if (data) {
          // 3. Penalty Logic: Check for previous matches
          // Fetch matches for the PREVIOUS batch to penalize users who were matched last week.
          // Previous Batch: Current Batch - 7 days
          // We check 'match_requests' where status is 'accepted' and created_at is in previous batch range?
          // Actually, match requests are created during the Matching Period (Fri-Sat).
          // So we should check match_requests created between Previous Friday and Previous Sunday?
          // Or just check if they had ANY accepted match in the last 7 days.
          // Let's check for accepted matches in the last 7 days.
          const oneWeekAgo = subDays(new Date(), 7);

          const { data: recentMatches } = await supabase
            .from('match_requests')
            .select('sender_id, receiver_id')
            .eq('status', 'accepted')
            .or(`sender_id.eq.${myMemberId},receiver_id.eq.${myMemberId}`)
            .gte('created_at', oneWeekAgo.toISOString());

          const matchedUserIds = new Set<number>();
          if (recentMatches) {
            recentMatches.forEach(m => {
              matchedUserIds.add(m.sender_id);
              matchedUserIds.add(m.receiver_id);
            });
          }

          const formattedProfiles: UserProfile[] = (data as any)
            .filter((member: any) => member.member_books && member.member_books.length > 0) // Only show members with books
            .map((member: any) => {
              // Sort books by created_at desc to get the latest one
              const books = Array.isArray(member.member_books) ? member.member_books : [member.member_books];
              const sortedBooks = [...books].sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              const latestBook = sortedBooks[0];

              // Handle potential missing fields
              const nickname = member.nickname || "익명";
              const age = member.age || (member.birth_date ? new Date().getFullYear() - parseInt(member.birth_date.substring(0, 4)) : 0);
              const location = member.location || "알 수 없음";
              const photos = member.photos && member.photos.length > 0 ? member.photos : (member.photo_url ? [member.photo_url] : []);
              const bio = member.bio || "";

              if (!latestBook) return null;

              return {
                id: member.id,
                nickname,
                age,
                location,
                photos,
                bio,
                bookTitle: latestBook.book_title,
                bookReview: latestBook.book_review,
                reviewExcerpt: latestBook.book_review.length > 50
                  ? latestBook.book_review.substring(0, 50) + "..."
                  : latestBook.book_review,
                isPenalized: matchedUserIds.has(member.id) // Add flag for sorting
              };
            })
            .filter((p: any): p is UserProfile => p !== null)
            // Sort: Non-penalized first, then Penalized. Within groups, random or by ID.
            // Let's just put penalized at the bottom.
            .sort((a: UserProfile, b: UserProfile) => {
              // We filtered out nulls, so a and b are UserProfile
              if (a.isPenalized === b.isPenalized) return 0;
              return a.isPenalized ? 1 : -1;
            }) as UserProfile[];

          setProfiles(formattedProfiles);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Helper function to display location text
  const getLocationText = (location: string) => {
    const locationMap: { [key: string]: string } = {
      seoul: "서울",
      busan: "부산",
      incheon: "인천",
      daegu: "대구",
      daejeon: "대전",
      gwangju: "광주",
      other: "기타"
    };
    return locationMap[location] || location;
  };

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Spectator Popup */}
      {showSpectatorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="font-serif text-xl font-bold mb-2 text-center">이번 주 우리 동네는 쉬어가요</h3>
            <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
              아쉽게도 인원이 조금 부족했어요.<br />
              대신 <b>지금 활발하게 매칭 중인 다른 동네</b><br />
              분위기를 구경해보세요! (신청은 불가능해요)
            </p>
            <button
              onClick={() => setShowSpectatorPopup(false)}
              className="w-full py-3 bg-underline-red text-white rounded-xl font-bold shadow-lg shadow-underline-red/20"
            >
              핫한 다른 지역 구경가기
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FCFCFA]/95 backdrop-blur-md border-b border-[var(--foreground)]/5">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="w-8" /> {/* Spacer for centering */}
          <h1 className="font-serif text-2xl text-[var(--foreground)] tracking-wide">
            Underline
          </h1>
          <button
            onClick={onShowNotifications}
            className="p-2 -mr-2 rounded-full hover:bg-[var(--foreground)]/5 transition-colors text-[var(--foreground)] relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--primary)] rounded-full border border-[#FCFCFA]"></span>
            )}
          </button>
        </div>

        {/* Floating Badge - Dating Period Timer OR Spectator Banner */}
        <div className="px-6 pb-3">
          {isSpectator ? (
            <div className="px-4 py-2 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all duration-500 bg-gray-800 shadow-black/20">
              <span className="text-xs font-sans font-medium tracking-wide text-white">
                👀 다른 지역 구경 중 (매칭 신청 불가)
              </span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all duration-500 bg-[var(--foreground)] shadow-black/20">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-sans font-medium tracking-wide text-white">
                {totalHours < 24 ? "마감 임박! " : ""}
                소개팅 기간 종료까지 {String(totalHours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Feed */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 py-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-[var(--foreground)]/60 font-sans">프로필을 불러오는 중...</p>
          </div>
        ) : profiles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => onProfileClick?.(profile.id.toString(), "home", { isPenalized: profile.isPenalized })}
                  className="bg-white border border-[var(--foreground)]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  {/* Photo Section */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <ImageWithFallback
                      src={profile.photos[0]}
                      alt={profile.nickname}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 blur-md"
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <h3 className="font-sans text-lg font-medium mb-1">
                            {profile.nickname}
                          </h3>
                          <p className="text-sm text-white/90 font-sans">
                            만 {profile.age}세
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-white/90">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-sans">{getLocationText(profile.location)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio and Book Review Section */}
                  <div className="p-4 bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] space-y-3">
                    {/* Bio */}
                    <div>
                      <h4 className="text-xs text-[var(--foreground)]/50 font-sans mb-2">자기소개</h4>
                      <p className="font-sans text-[var(--foreground)] leading-relaxed text-sm line-clamp-2">
                        {profile.bio}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Hint */}
            <div className="text-center py-6">
              <p className="text-sm text-[var(--foreground)]/40 font-sans">
                더 많은 프로필이 준비 중입니다
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-sm text-[var(--foreground)]/60 font-sans">
              아직 등록된 프로필이 없습니다.
            </p>
          </div>
        )}
      </div>

      {/* Sticky CTA for Spectators */}
      {isSpectator && <div className="fixed bottom-[80px] left-0 right-0 px-6 z-30">
        <button
          onClick={() => {
            if (onRegister) {
              onRegister();
            } else {
              alert("신청 기능을 불러올 수 없습니다.");
            }
          }}
          className="w-full py-3 bg-underline-red text-white rounded-xl font-bold shadow-lg shadow-underline-red/30 animate-bounce"
        >
          다음 주 {profiles[0]?.location || '우리 동네'} 무료 신청 예약
        </button>
      </div>
      }
      {/* Welcome Coupon Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-underline-red/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              🎟️
            </div>

            <h3 className="font-serif text-xl font-bold mb-2 text-underline-text">
              환영합니다!
            </h3>

            <p className="text-gray-600 mb-6 leading-relaxed">
              친구 초대로 가입하여<br />
              <span className="text-underline-red font-bold">50% 할인 쿠폰</span>을 받으셨어요!
            </p>

            <div className="bg-[#F5F5F0] p-4 rounded-xl mb-6 text-left">
              <p className="text-xs text-gray-500 font-bold mb-1">쿠폰 혜택</p>
              <p className="text-sm font-medium text-underline-text">첫 연락처 교환 시 50% 할인</p>
              <p className="text-[10px] text-gray-400 mt-1">마이페이지에서 확인하실 수 있습니다.</p>
            </div>

            <button
              onClick={() => {
                setShowWelcomeModal(false);
                sessionStorage.removeItem('showWelcomeModal');
              }}
              className="w-full py-3.5 bg-underline-red text-white rounded-xl font-bold shadow-lg shadow-underline-red/20 active:scale-[0.98] transition-transform"
            >
              확인했어요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
