import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CancelRecruitmentModal } from "./CancelRecruitmentModal";
import { supabase } from "../lib/supabase";

interface SuccessStory {
  id: string;
  userImage: string;
  bookTitle: string;
  testimonial: string;
  matchedSentence: string;
}

export function HomeRecruitingView({
  isSignedUp,
  onShowLoginModal,
  isRegistered,
  onRegister,
  onCancelRegister,
  onShowNotifications
}: {
  isSignedUp: boolean;
  onShowLoginModal: () => void;
  isRegistered: boolean;
  onRegister: () => void;
  onCancelRegister: () => void;
  onShowNotifications?: () => void;
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Countdown timer state (example: 2 days, 14 hours, 23 minutes remaining)
  // Calculate time left until next Friday 00:00:00
  const calculateTimeLeft = () => {
    const now = new Date();
    const target = new Date(now);

    // Calculate days until next Friday (5)
    const currentDay = now.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
    let daysUntilFriday = (5 - currentDay + 7) % 7;
    if (daysUntilFriday === 0) daysUntilFriday = 7;

    target.setDate(now.getDate() + daysUntilFriday);
    target.setHours(0, 0, 0, 0);

    const difference = target.getTime() - now.getTime();

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return { days, hours, minutes, seconds };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
          'Authorization': `Bearer ${token}`
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

  const handleRegisterClick = () => {
    if (!isSignedUp) {
      onShowLoginModal();
      return;
    }
    onRegister();
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const successStories: SuccessStory[] = [
    {
      id: "1",
      userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      bookTitle: "참을 수 없는 존재의 가벼움",
      testimonial: "같은 문장에 밑줄을 그은 사람을 만나다니, 운명 같았어요.",
      matchedSentence: "가벼움과 무거움 사이에서..."
    },
    {
      id: "2",
      userImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      bookTitle: "데미안",
      testimonial: "책을 통해 연결된 첫 만남, 대화가 끊이지 않았어요.",
      matchedSentence: "새는 알에서 나오려고 투쟁한다..."
    },
    {
      id: "3",
      userImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      bookTitle: "1984",
      testimonial: "같은 책을 읽은 사람과의 만남은 특별했습니다.",
      matchedSentence: "자유는 노예 상태이다..."
    },
  ];

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FCFCFA] border-b border-[#1A3C34]/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="w-8" /> {/* Spacer for centering */}
          <h1 className="font-serif text-2xl text-[#1A3C34] tracking-wide">
            Underline
          </h1>
          <button
            onClick={onShowNotifications}
            className="p-2 hover:bg-[#1A3C34]/5 rounded-full transition-colors relative"
          >
            <Bell className="w-5 h-5 text-[#1A3C34]" />
            {/* Notification badge */}
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#D4AF37] rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-sans font-medium px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Hero Section */}
        <div className="px-6 py-8 text-center">
          {/* Countdown Timer */}
          <div className="mb-6">
            <p className={`text-sm font-sans mb-3 ${timeLeft.days === 0 ? "text-[#FF6B6B] font-bold animate-pulse" : "text-[#1A3C34]/60"}`}>
              {timeLeft.days === 0 ? "마감 임박! " : ""}
              {isRegistered ? "소개팅 오픈까지" : "신청 마감까지"}
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className={`border rounded-xl px-4 py-3 shadow-sm min-w-[70px] ${timeLeft.days === 0 ? "bg-[#FFF0F0] border-[#FF6B6B]" : "bg-white border-[#1A3C34]/10"}`}>
                <div className={`font-serif text-3xl ${timeLeft.days === 0 ? "text-[#FF6B6B]" : "text-[#1A3C34]"}`}>
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className={`text-[10px] font-sans mt-1 ${timeLeft.days === 0 ? "text-[#FF6B6B]/70" : "text-[#1A3C34]/50"}`}>
                  DAY
                </div>
              </div>
              <div className="font-serif text-2xl text-[#1A3C34]/30">:</div>
              <div className={`border rounded-xl px-4 py-3 shadow-sm min-w-[70px] ${timeLeft.days === 0 ? "bg-[#FFF0F0] border-[#FF6B6B]" : "bg-white border-[#1A3C34]/10"}`}>
                <div className={`font-serif text-3xl ${timeLeft.days === 0 ? "text-[#FF6B6B]" : "text-[#1A3C34]"}`}>
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className={`text-[10px] font-sans mt-1 ${timeLeft.days === 0 ? "text-[#FF6B6B]/70" : "text-[#1A3C34]/50"}`}>
                  HOUR
                </div>
              </div>
              <div className="font-serif text-2xl text-[#1A3C34]/30">:</div>
              <div className={`border rounded-xl px-4 py-3 shadow-sm min-w-[70px] ${timeLeft.days === 0 ? "bg-[#FFF0F0] border-[#FF6B6B]" : "bg-white border-[#1A3C34]/10"}`}>
                <div className={`font-serif text-3xl ${timeLeft.days === 0 ? "text-[#FF6B6B]" : "text-[#1A3C34]"}`}>
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className={`text-[10px] font-sans mt-1 ${timeLeft.days === 0 ? "text-[#FF6B6B]/70" : "text-[#1A3C34]/50"}`}>
                  MIN
                </div>
              </div>
            </div>
          </div>

          {/* Main Text */}
          <h2 className="font-serif text-2xl text-[#1A3C34] mb-6 leading-relaxed">
            {isRegistered ? (
              <>
                이번주 금요일에
                <br />
                만나요
              </>
            ) : (
              <>
                이번 주 소개팅에
                <br />
                참여하세요
              </>
            )}
          </h2>

          {/* Primary CTA */}
          <button
            className={`w-full font-sans font-medium py-4 rounded-lg transition-all duration-300 text-base ${isRegistered
              ? "bg-[#1A3C34] text-white hover:bg-[#1A3C34]/90"
              : "bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90 shadow-xl shadow-[#D4AF37]/30"
              }`}
            onClick={isRegistered ? handleCancelClick : handleRegisterClick}
          >
            {isRegistered ? "신청 완료" : "참여 신청하기"}
          </button>

          {/* Info Text */}
          <p className="text-xs text-[#1A3C34]/40 font-sans mt-4 leading-relaxed">
            {isRegistered
              ? "신청을 취소하시려면 버튼을 다시 눌러주세요"
              : "매주 금요일 밤 8시, 새로운 인연이 시작됩니다"
            }
          </p>
        </div >

        {/* Content Feed */}
        < div className="px-6 py-6 bg-gradient-to-b from-[#FCFCFA] to-[#F5F5F0]" >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl text-[#1A3C34]">
              지난주 매칭 성공
            </h3>
            <div className="h-px flex-1 ml-3 bg-[#D4AF37]/20" />
          </div>

          {/* Horizontal Scroll Cards */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {successStories.map((story) => (
              <div
                key={story.id}
                className="flex-shrink-0 w-[280px] bg-white border border-[#1A3C34]/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#1A3C34]/10">
                    <ImageWithFallback
                      src={story.userImage}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[#1A3C34] text-sm truncate">
                      {story.bookTitle}
                    </p>
                    <p className="text-xs text-[#1A3C34]/50 font-sans">
                      매칭 성공
                    </p>
                  </div>
                </div>

                {/* Matched Sentence */}
                <div className="bg-[#FCFCFA] border border-[#D4AF37]/20 rounded-lg p-3 mb-3">
                  <p className="font-serif text-sm text-[#1A3C34] italic leading-relaxed">
                    "{story.matchedSentence}"
                  </p>
                </div>

                {/* Testimonial */}
                <p className="text-sm text-[#1A3C34]/70 font-sans leading-relaxed">
                  {story.testimonial}
                </p>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="font-serif text-2xl text-[#D4AF37] mb-1">
                1,247
              </div>
              <div className="text-xs text-[#1A3C34]/60 font-sans">
                누적 매칭
              </div>
            </div>
            <div className="text-center">
              <div className="font-serif text-2xl text-[#D4AF37] mb-1">
                89%
              </div>
              <div className="text-xs text-[#1A3C34]/60 font-sans">
                만족도
              </div>
            </div>
            <div className="text-center">
              <div className="font-serif text-2xl text-[#D4AF37] mb-1">
                342
              </div>
              <div className="text-xs text-[#1A3C34]/60 font-sans">
                이번 주 신청
              </div>
            </div>
          </div>
        </div >

        {/* How It Works Section */}
        < div className="px-6 py-8" >
          <h3 className="font-serif text-xl text-[#1A3C34] mb-6 text-center">
            어떻게 진행되나요?
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-sans text-sm">
                1
              </div>
              <div>
                <h4 className="font-sans font-medium text-[#1A3C34] mb-1">
                  프로필 등록
                </h4>
                <p className="text-sm text-[#1A3C34]/60 font-sans leading-relaxed">
                  인생책과 마음에 남은 문장을 공유하세요
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-sans text-sm">
                2
              </div>
              <div>
                <h4 className="font-sans font-medium text-[#1A3C34] mb-1">
                  매칭 대기
                </h4>
                <p className="text-sm text-[#1A3C34]/60 font-sans leading-relaxed">
                  AI가 책 취향과 가치관이 맞는 상대를 찾아드려요
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-sans text-sm">
                3
              </div>
              <div>
                <h4 className="font-sans font-medium text-[#1A3C34] mb-1">
                  만남 시작
                </h4>
                <p className="text-sm text-[#1A3C34]/60 font-sans leading-relaxed">
                  금요일 밤 8시, 우편함에서 새로운 인연을 확인하세요
                </p>
              </div>
            </div>
          </div>
        </div >
      </div >

      {/* Cancel Recruitment Modal */}
      < CancelRecruitmentModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)
        }
        onConfirm={() => {
          onCancelRegister();
          setShowCancelModal(false);
        }}
      />
    </div >
  );
}