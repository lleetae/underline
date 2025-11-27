
import React, { useState, useEffect } from "react";
import { MapPin, Bell } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { supabase } from "../lib/supabase";
import { useCountdown } from "../hooks/useCountdown";

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
}

export function HomeDatingView({ onProfileClick, isSignedUp, onShowNotifications }: {
  onProfileClick?: (profileId: string, source?: "home" | "mailbox") => void;
  isSignedUp?: boolean;
  onShowNotifications?: () => void;
}) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
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


        // Fetch candidates (excluding myself) and filter by dating_applications existence
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
  dating_applications!inner(*)
    `)
          .eq('dating_applications.status', 'active'); // Only show active applications

        if (myMemberId) {
          query = query.neq('id', myMemberId);
        }

        if (myGender) {
          // Filter for opposite gender
          query = query.neq('gender', myGender);
        }

        const { data, error } = await query.limit(20);

        if (error) throw error;

        if (data) {
          const formattedProfiles: UserProfile[] = data
            .filter(member => member.member_books && member.member_books.length > 0) // Only show members with books
            .map(member => {
              // Sort books by created_at desc to get the latest one
              // member_books is an array, we need to cast it or handle it safely
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

              // If latestBook is missing (should be filtered out, but for safety)
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
                  : latestBook.book_review
              };
            })
            .filter((p): p is UserProfile => p !== null); // Filter out nulls

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
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FAFAFA] border-b border-[#333333]/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="w-8" /> {/* Spacer for centering */}
          <h1 className="font-serif text-2xl text-[#333333] tracking-wide">
            Underline
          </h1>
          <MailboxHeaderButton unreadCount={unreadCount} onShowNotifications={onShowNotifications} />
        </div>

        {/* Floating Badge - Dating Period Timer */}
        <div className="px-6 pb-3">
          <div className={`
            px-4 py-2 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all duration-500
            ${totalHours < 24
              ? "bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] shadow-[#FF6B6B]/30 animate-pulse"
              : "bg-gradient-to-r from-[#171717] to-[#333333] shadow-[#171717]/30"
            }
          `}>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-sans font-medium tracking-wide text-white">
              {totalHours < 24 ? "마감 임박! " : ""}
              소개팅 기간 종료까지 {String(totalHours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Feed */}
      <div className="flex-1 overflow-y-auto pb-24 px-6 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#171717] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-[#333333]/60 font-sans">프로필을 불러오는 중...</p>
          </div>
        ) : profiles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => onProfileClick?.(profile.id.toString())}
                  className="bg-white border border-[#333333]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  {/* Photo Section */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <ImageWithFallback
                      src={profile.photos[0]}
                      alt={profile.nickname}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <h3 className="font-sans text-xl font-medium mb-1">
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
                  <div className="p-5 bg-white border border-[#C2C2C2]/60 space-y-4 rounded-xl shadow-sm">
                    {/* Bio */}
                    <div>
                      <h4 className="text-xs text-[#333333]/50 font-sans mb-2">자기소개</h4>
                      <p className="font-sans text-[#333333] leading-relaxed text-sm line-clamp-2">
                        {profile.bio}
                      </p>
                    </div>


                  </div>
                </div>
              ))}
            </div>

            {/* Load More Hint */}
            <div className="text-center py-8">
              <p className="text-sm text-[#333333]/40 font-sans">
                더 많은 프로필이 준비 중입니다
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-sm text-[#333333]/60 font-sans">
              아직 등록된 프로필이 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MailboxHeaderButton({ unreadCount, onShowNotifications }: { unreadCount: number; onShowNotifications?: () => void }) {
  return (
    <button
      onClick={onShowNotifications}
      className="p-2 hover:bg-[#171717]/6 rounded-full transition-colors relative"
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5 text-[#171717]" />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#CC0000] rounded-full border border-[#FAFAFA]" />
      )}
    </button>
  );
}
