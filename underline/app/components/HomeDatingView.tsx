
import React, { useState, useEffect } from "react";
import { MapPin, Bell, Copy, X, ChevronLeft } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { supabase } from "../lib/supabase";
import { useCountdown } from "../hooks/useCountdown";
import { BatchUtils } from "../utils/BatchUtils";
import { subDays } from "date-fns";
import { getSidosInSameGroup, getRegionGroupKey } from "../utils/RegionUtils";
import { handleCopy } from "../utils/clipboard";

interface UserProfile {
  id: number;
  nickname: string;
  age: number;
  location: string; // Keep for backward compatibility or display
  sido: string;
  sigungu: string;
  photos: string[];
  bio: string;
  bookTitle: string;
  bookReview: string;
  reviewExcerpt: string;
  isPenalized: boolean;
}

interface HomeDatingViewProps {
  onProfileClick?: (profileId: string, source?: "home" | "mailbox", metadata?: { isPenalized?: boolean }) => void;
  isSignedUp?: boolean;
  onShowNotifications: () => void;
  isSpectator: boolean;
  onRegister?: () => void;
  isApplied?: boolean;
  userId?: string | null;
  onSetSpectator?: (isSpectator: boolean) => void;
  onBack?: () => void;
}

export function HomeDatingView({
  isSignedUp,
  onProfileClick,
  onShowNotifications,
  isSpectator,
  onRegister,
  isApplied = false,
  userId,
  onSetSpectator,
  onBack
}: HomeDatingViewProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSpectatorPopup, setShowSpectatorPopup] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

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
      // Use getSession instead of refreshSession to avoid error if session is missing
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        // console.error("Session check failed:", sessionError); // Suppress log to avoid noise if just logged out
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
      } else {
        console.error("Failed to fetch unread count:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        if (!isSignedUp) {
          setIsLoading(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          console.error("Debug: Failed to get session", sessionError);
          setIsLoading(false);
          return;
        }

        const user = session.user;

        // Fetch current user's gender using auth_id
        const { data: currentUserData } = await supabase
          .from('member')
          .select('id, gender, sido, sigungu')
          .eq('auth_id', user.id)
          .single();

        const myGender = currentUserData?.gender;
        const myMemberId = currentUserData?.id;
        const mySido = currentUserData?.sido;
        const mySigungu = currentUserData?.sigungu;

        console.log("Debug: Current User", { myMemberId, myGender, mySido, mySigungu });

        // 1. Determine Current Batch Range
        // We only want candidates who applied for THIS batch.
        const currentBatchDate = BatchUtils.getCurrentBatchStartDate();
        const { start, end } = BatchUtils.getBatchApplicationRange(currentBatchDate);

        console.log("Debug: Batch Range", { currentBatchDate, start, end });

        // 2. Fetch candidates (excluding myself) and filter by dating_applications existence in range
        let query = supabase
          .from('member')
          .select(`
            id,
            nickname,
            age,
            birth_date,
            sido,
            sigungu,
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

        if (isSpectator) {
          // If Spectator (Failed Region), show users from OTHER regions
          // Exclude my own region (sido + sigungu)
          if (mySido && mySigungu) {
            // Note: Supabase doesn't support complex NEQ on multiple columns easily in one go for "NOT (A AND B)"
            // But we can approximate or use a filter.
            // For now, let's just filter by Sido if possible, or maybe just show everyone else?
            // "Other regions" usually implies "Not my exact location".
            // Let's filter out anyone with SAME sido AND sigungu.
            // Since ORM limitations, we might filter in memory if dataset is small, or use a raw filter.
            // But `neq` on `location` string was easy.
            // Let's try to use `not.and` if available, or just filter out by `location` string for now if it's still populated?
            // User wants FULL migration.
            // We can use `not` with a filter string: `not.and(sido.eq.${mySido},sigungu.eq.${mySigungu})` - syntax might be tricky.
            // Simpler approach: Filter out by Sido OR Sigungu? No.
            // Let's assume strict matching:
            // query = query.not('sido', 'eq', mySido).not('sigungu', 'eq', mySigungu) -> This excludes anyone with same sido OR same sigungu. Too strict.
            // We want to exclude (sido == mySido && sigungu == mySigungu).
            // Let's fetch all and filter in memory for spectator mode, or use the `location` string if we trust it's synced.
            // Since we are syncing, let's use `location` for the NEQ query for simplicity, OR construct the filter.
            // Actually, let's try to filter by `sido` first?
            // If I am in Seoul Gangnam, I want to see people NOT in Seoul Gangnam.
            // Maybe just `neq('sido', mySido)`? No, I might want to see Seoul Mapo.
            // Let's do in-memory filtering for Spectator mode to be safe and correct with new columns.
          }
        } else {
          // If Participant (Active Region), show users from MY region GROUP
          if (mySido) {
            const sidosInGroup = getSidosInSameGroup(mySido);
            console.log("Debug: Sidos in Group", sidosInGroup);
            if (sidosInGroup.length > 0) {
              query = query.in('sido', sidosInGroup);
            } else {
              // Fallback if no group found (shouldn't happen for valid sidos)
              query = query.eq('sido', mySido);
            }
          }
        }

        if (myGender) {
          // Filter for opposite gender
          query = query.neq('gender', myGender);
        }

        const { data, error } = await query.limit(50); // Fetch more to handle sorting

        if (error) throw error;

        console.log("Debug: Fetched Candidates Count", data?.length);
        if (data && data.length === 0) {
          console.log("Debug: No candidates found. Check DB for matching records.");
        }
        // Check if my region is "Open" (>= 1 males AND >= 1 females)
        // Only check if NOT already in spectator mode to avoid infinite loop
        if (!isSpectator && mySido) {
          const groupKey = getRegionGroupKey(mySido);
          const { data: statsData } = await supabase
            .from('dating_applications')
            .select(`
              member!inner (
                sido,
                gender
              )
            `)
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .neq('status', 'cancelled');

          let maleCount = 0;
          let femaleCount = 0;

          if (statsData) {
            statsData.forEach((app: any) => {
              const appGroupKey = getRegionGroupKey(app.member?.sido || '');
              if (appGroupKey === groupKey) {
                if (app.member?.gender === 'male') maleCount++;
                else if (app.member?.gender === 'female') femaleCount++;
              }
            });
          }

          console.log("Debug: Region Stats", { groupKey, maleCount, femaleCount });

          if (maleCount < 1 || femaleCount < 1) {
            if (onSetSpectator) {
              onSetSpectator(true);
            }
            console.log("Debug: Region Closed -> Spectator Mode");
          }
        }

        if (data) {
          // 3. Penalty Logic: Check for previous matches
          // ... (same as before)
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

          let formattedProfiles: UserProfile[] = (data as any)
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
              // Construct location from sido/sigungu
              const locationDisplay = (member.sido && member.sigungu)
                ? `${member.sido} ${member.sigungu}`
                : (member.location || "알 수 없음");

              const photos = member.photos && member.photos.length > 0 ? member.photos : (member.photo_url ? [member.photo_url] : []);
              const bio = member.bio || "";

              if (!latestBook) return null;

              return {
                id: member.id,
                nickname,
                age,
                location: locationDisplay,
                sido: member.sido,
                sigungu: member.sigungu,
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
            .filter((p: any): p is UserProfile => p !== null);

          // In-memory filtering for Spectator mode (exclude my region GROUP)
          if (isSpectator && mySido) {
            const sidosInGroup = getSidosInSameGroup(mySido);
            formattedProfiles = formattedProfiles.filter(p =>
              !sidosInGroup.includes(p.sido)
            );
          }

          // Sort: Non-penalized first, then Penalized.
          formattedProfiles.sort((a: UserProfile, b: UserProfile) => {
            if (a.isPenalized === b.isPenalized) return 0;
            return a.isPenalized ? 1 : -1;
          });

          setProfiles(formattedProfiles);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [isSignedUp, isSpectator]);

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="font-sans text-xl font-bold mb-2 text-center">이번 주 우리 동네는 쉬어가요</h3>
            <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
              아쉽게도 인원이 조금 부족했어요.<br />
              대신 <b>지금 활발하게 매칭 중인 다른 동네</b><br />
              분위기를 구경해보세요! (매칭 신청은 불가능해요)
            </p>
            <button
              onClick={() => setShowSpectatorPopup(false)}
              className="w-full py-3 bg-underline-red text-white rounded-xl font-bold shadow-lg shadow-underline-red/20"
            >
              다른 지역 소개팅 구경하기
            </button>
          </div>
        </div>
      )}

      {/* Header - Aligned with HomeRecruitingView */}
      <header className="sticky top-0 z-50 bg-underline-cream/90 backdrop-blur-sm h-[60px] flex items-center justify-between px-5 border-b border-black/5">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors text-underline-text"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-6" /> // Spacer matching HomeRecruitingView width
        )}

        <h1 className="font-sans text-2xl font-bold tracking-tight text-underline-text">
          Under
          <span className="relative inline-block">
            line
            <span className="absolute bottom-0 left-0 w-full h-[4px] bg-underline-red rounded-full"></span>
          </span>
        </h1>

        <button
          onClick={onShowNotifications}
          className="relative p-2 -mr-2 text-underline-text/80 hover:text-underline-text transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-underline-red rounded-full border border-underline-cream"></span>
          )}
        </button>
      </header>

      {/* Floating Badge - Dating Period Timer (Only for Participants) */}
      {!isSpectator && (
        <div className="px-6 pb-3">
          <div className="px-4 py-2 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all duration-500 bg-[var(--foreground)] shadow-black/20">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-sans font-medium tracking-wide text-white">
              {totalHours < 24 ? "마감 임박! " : ""}
              소개팅 기간 종료까지 {String(totalHours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}


      {/* Profile Feed */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 py-3">
        {/* Spectator Mode Banner (Scrollable) */}
        {isSpectator && (
          <div className="w-full bg-gray-100 border border-gray-200 rounded-xl p-4 mb-6 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-1">
              아쉽게도 이번 주는 매칭이 쉬어가요 😢
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              우리 동네 인원이 조금 부족했어요.<br />
              대신 <span className="text-underline-red font-bold">지금 다른 동네</span>를 구경시켜 드릴게요!
            </p>
          </div>
        )}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-[var(--foreground)]/60 font-sans">프로필을 불러오는 중...</p>
          </div>
        ) : profiles.length > 0 ? (
          <>
            {isSpectator && (
              <div className="mb-4 px-2">
                <h2 className="text-lg font-sans font-bold text-gray-800 mb-1">
                  다른 지역 둘러보기 👀
                </h2>
                <p className="text-xs text-gray-500">
                  매칭 신청은 불가능하지만, 어떤 분들이 있는지 구경해보세요.
                </p>
              </div>
            )}
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

                    {/* Spectator Badge */}
                    {isSpectator && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-lg">
                          구경용
                        </span>
                      </div>
                    )}

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
      {
        isSpectator && <div className="fixed bottom-[100px] left-0 right-0 px-6 z-30">
          <button
            onClick={() => {
              if (isApplied) {
                setShowReferralModal(true);
              } else {
                if (onRegister) {
                  onRegister();
                } else {
                  alert("신청 기능을 불러올 수 없습니다.");
                }
              }
            }}
            className={`w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 ${isApplied
              ? "bg-white text-underline-red border border-underline-red/30 shadow-underline-red/10"
              : "bg-underline-red text-white shadow-underline-red/30 animate-bounce"
              }`}
          >
            {isApplied ? (
              <>
                <Copy className="w-4 h-4" />
                친구 초대하고 무료 교환권 받기
              </>
            ) : (
              "다음 주 우리 동네 무료 신청 예약"
            )}
          </button>
        </div>
      }

      {/* Referral Modal */}
      {
        showReferralModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowReferralModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="font-sans text-xl font-bold mb-6 text-center text-underline-text">
                친구 초대 혜택
              </h3>

              <div className="space-y-4 mb-8">
                <div className="bg-[#F5F5F0] p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-underline-red/10 rounded-full flex items-center justify-center text-xl">
                    🎁
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-0.5">나 (초대자)</p>
                    <p className="text-sm font-medium text-underline-text">무료 연락처 교환권 1장</p>
                  </div>
                </div>

                <div className="bg-[#F5F5F0] p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-underline-red/10 rounded-full flex items-center justify-center text-xl">
                    🎟️
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-0.5">친구 (초대받은 사람)</p>
                    <p className="text-sm font-medium text-underline-text">연락처 교환 50% 할인 쿠폰</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-underline-red/80 font-medium text-center mb-3">
                *복사한 링크를 통해 가입해야 쿠폰을 받으실 수 있습니다
              </p>

              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}?ref=${userId || ''}`;
                  handleCopy(shareUrl, '초대 링크가 복사되었습니다!');
                  setShowReferralModal(false);
                }}
                className="w-full py-3.5 bg-underline-red text-white rounded-xl font-bold shadow-lg shadow-underline-red/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Copy className="w-4 h-4" />
                초대 링크 복사하기
              </button>
            </div>
          </div>
        )
      }
      {/* Welcome Coupon Modal */}
      {
        showWelcomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
              <div className="w-16 h-16 bg-underline-red/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🎟️
              </div>

              <h3 className="font-sans text-xl font-bold mb-2 text-underline-text">
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
        )
      }
    </div >
  );
}
