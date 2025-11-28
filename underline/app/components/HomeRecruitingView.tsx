import React, { useState, useEffect } from "react";
import { TermsContent, PrivacyContent } from "../utils/PolicyComponents";
import { Bell, BookOpen, User, Mail } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useCountdown } from "../hooks/useCountdown";
import useEmblaCarousel from "embla-carousel-react";

import { supabase } from "../lib/supabase";

interface HomeRecruitingViewProps {
  isSignedUp: boolean;
  onShowLoginModal: () => void;
  isRegistered: boolean;
  onRegister: () => void;
  onCancelRegister: () => void;
  onShowNotifications?: () => void;
}

interface SuccessStory {
  id: string;
  imageUrl: string;
  title: string;
  bookInfo: string;
  detailQuestion: string;
  detailAnswer: string;
}

export function HomeRecruitingView({
  isSignedUp,
  onShowLoginModal,
  isRegistered,
  onRegister,
  onCancelRegister,
  onShowNotifications,
}: HomeRecruitingViewProps) {
  // Countdown timer for next Friday 00:00:00 (Thursday 23:59 deadline)
  const timeLeft = useCountdown(5, 0);
  const [emblaRef] = useEmblaCarousel({ align: "start", dragFree: true });
  const [activePolicyModal, setActivePolicyModal] = useState<'terms' | 'privacy' | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reviews, setReviews] = useState<SuccessStory[]>([]);
  const [selectedReview, setSelectedReview] = useState<SuccessStory | null>(null); // For Modal

  // Fetch unread notification count
  useEffect(() => {
    if (!isSignedUp) return;

    const fetchUnreadCount = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
        if (sessionError || !session) return;

        const response = await fetch('/api/notifications?unread_only=true', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [isSignedUp]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          const mappedReviews: SuccessStory[] = data.map((item: any) => ({
            id: item.id,
            imageUrl: item.image_url,
            title: item.title,
            bookInfo: item.book_info,
            detailQuestion: item.detail_question,
            detailAnswer: item.detail_answer
          }));
          setReviews(mappedReviews);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-underline-cream text-underline-text font-sans pb-20 max-w-md mx-auto shadow-2xl shadow-black/5 relative">
      {/* 1. GNB (Header) */}
      <header className="sticky top-0 z-50 bg-underline-cream/90 backdrop-blur-sm h-[60px] flex items-center justify-between px-5 border-b border-black/5">
        <div className="w-6" /> {/* Spacer */}
        <h1 className="font-serif text-2xl font-bold tracking-tight text-underline-text">
          Underline
        </h1>
        <button
          onClick={onShowNotifications}
          className="relative p-2 -mr-2 text-underline-text/80 hover:text-underline-text transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-underline-red rounded-full border border-underline-cream" />
          )}
        </button>
      </header>

      {/* 2. Hero Section */}
      <section className="px-6 pt-10 pb-12 text-center">
        {/* Timer */}
        <div className="mb-8">
          <p className={`text-sm font-sans mb-3 ${timeLeft.days === 0 ? "text-[#FF6B6B] font-bold animate-pulse" : "text-underline-text/60"}`}>
            {timeLeft.days === 0 ? "마감 임박! " : ""}
            신청 마감까지
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className={`border rounded-xl px-4 py-3 shadow-sm min-w-[70px] ${timeLeft.days === 0 ? "bg-[#FFF0F0] border-[#FF6B6B]" : "bg-white border-black/5"}`}>
              <div className={`font-serif text-3xl ${timeLeft.days === 0 ? "text-[#FF6B6B]" : "text-underline-text"}`}>
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className={`text-[10px] font-sans mt-1 ${timeLeft.days === 0 ? "text-[#FF6B6B]/70" : "text-underline-text/50"}`}>
                DAY
              </div>
            </div>
            <div className="font-serif text-2xl text-underline-text/30">:</div>
            <div className={`border rounded-xl px-4 py-3 shadow-sm min-w-[70px] ${timeLeft.days === 0 ? "bg-[#FFF0F0] border-[#FF6B6B]" : "bg-white border-black/5"}`}>
              <div className={`font-serif text-3xl ${timeLeft.days === 0 ? "text-[#FF6B6B]" : "text-underline-text"}`}>
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className={`text-[10px] font-sans mt-1 ${timeLeft.days === 0 ? "text-[#FF6B6B]/70" : "text-underline-text/50"}`}>
                HOUR
              </div>
            </div>
            <div className="font-serif text-2xl text-underline-text/30">:</div>
            <div className={`border rounded-xl px-4 py-3 shadow-sm min-w-[70px] ${timeLeft.days === 0 ? "bg-[#FFF0F0] border-[#FF6B6B]" : "bg-white border-black/5"}`}>
              <div className={`font-serif text-3xl ${timeLeft.days === 0 ? "text-[#FF6B6B]" : "text-underline-text"}`}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className={`text-[10px] font-sans mt-1 ${timeLeft.days === 0 ? "text-[#FF6B6B]/70" : "text-underline-text/50"}`}>
                MIN
              </div>
            </div>
          </div>
        </div>
        {/* Main Copy */}
        <h2 className="font-serif text-[26px] leading-snug font-semibold mb-4 text-underline-text break-keep">
          당신의 내면을 읽어줄 사람,<br />
          이번 주 금요일에 만나보세요.
        </h2>

        {/* Sub Copy */}
        <p className="text-underline-text/60 text-sm mb-8 leading-relaxed break-keep">
          겉모습 뒤에 숨겨진 '진짜 나'를 알아보는 대화.
        </p>

        {/* Main CTA */}
        <div className="relative z-10">
          <button
            onClick={isRegistered ? onCancelRegister : (isSignedUp ? onRegister : onShowLoginModal)}
            className={`w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-all transform active:scale-[0.98] ${isRegistered
              ? "bg-gray-200 text-gray-500"
              : "bg-underline-red text-white shadow-underline-red/30 hover:shadow-underline-red/40"
              }`}
          >
            {isRegistered
              ? "소개팅 대기중"
              : (timeLeft.days === 0 && timeLeft.hours < 24 // If it's Friday/Saturday (Matching Period)
                ? "다음 주 소개팅 미리 신청하기"
                : "이번 주 소개팅 무료 신청하기"
              )
            }
          </button>
          <p className="text-[11px] text-underline-text/40 mt-3">
            {isRegistered
              ? "신청이 접수되었습니다. 다음 주 금요일을 기대해주세요!"
              : "매주 금요일 밤 8시, 새로운 인연이 시작됩니다"
            }
          </p>
        </div>
      </section>

      {/* 3. Social Proof (Horizontal Scroll) */}
      <section className="py-10 bg-white border-y border-black/5">
        <div className="px-6 mb-6">
          <h3 className="font-serif text-xl font-bold text-underline-text">
            실제 유저 후기
          </h3>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex px-6 gap-4">
            {reviews.map((story) => (
              <div
                key={story.id}
                onClick={() => setSelectedReview(story)}
                className="flex-[0_0_70%] min-w-0 relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md group cursor-pointer"
              >
                {/* Background Image */}
                <ImageWithFallback
                  src={story.imageUrl}
                  alt="User"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <div className="pr-2">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 text-[10px] font-medium mb-3">
                      <span>📖</span>
                      <span>{story.bookInfo}</span>
                    </div>
                    <p className="text-lg font-bold leading-snug opacity-100 break-keep drop-shadow-md">
                      {story.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative h-48">
              <ImageWithFallback
                src={selectedReview.imageUrl}
                alt="Review"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => setSelectedReview(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="inline-block px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm text-[10px] font-medium mb-2 border border-white/10">
                  📖 {selectedReview.bookInfo}
                </div>
                <h3 className="font-serif text-xl font-bold leading-tight">
                  {selectedReview.title}
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-[var(--primary)] mb-2">Q. {selectedReview.detailQuestion}</p>
                <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                  {selectedReview.detailAnswer}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Live Stats */}
      <section className="px-6 py-12">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="font-serif text-2xl font-bold text-underline-text mb-1">
              1,247
            </div>
            <div className="text-xs text-underline-text/50">누적 매칭</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-2xl font-bold text-underline-text mb-1">
              89%
            </div>
            <div className="text-xs text-underline-text/50">만족도</div>
          </div>
          <div className="text-center relative">
            <div className="font-serif text-2xl font-bold text-underline-text mb-1 flex items-center justify-center gap-1">
              342
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mb-3" />
            </div>
            <div className="text-xs text-underline-text/50">이번 주 신청</div>
          </div>
        </div>
      </section>

      {/* 5. Process */}
      <section className="px-6 py-10 bg-white border-t border-black/5">
        <h3 className="font-serif text-xl font-bold text-underline-text mb-8 text-center">
          가벼운 만남 대신,<br />
          이렇게 연결됩니다
        </h3>

        <div className="space-y-8 relative">
          {/* Connecting Line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-black/5" />

          {/* Step 1 */}
          <div className="relative flex gap-5">
            <div className="relative z-10 w-10 h-10 rounded-full bg-underline-cream border border-black/10 flex items-center justify-center text-lg shadow-sm">
              <BookOpen className="w-5 h-5 text-underline-red" />
            </div>
            <div className="flex-1 pt-1">
              <h4 className="font-bold text-underline-text mb-1">나만의 서재 등록하기</h4>
              <p className="text-sm text-underline-text/60 leading-relaxed">
                사진보다 먼저, 당신의 인생 책과 느낀 점을 꽂아두세요. 그게 당신의 진짜 모습이니까요.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex gap-5">
            <div className="relative z-10 w-10 h-10 rounded-full bg-underline-cream border border-black/10 flex items-center justify-center text-lg shadow-sm">
              <User className="w-5 h-5 text-underline-red" />
            </div>
            <div className="flex-1 pt-1">
              <h4 className="font-bold text-underline-text mb-1">결이 맞는 사람 찾기</h4>
              <p className="text-sm text-underline-text/60 leading-relaxed">
                당신의 책 취향을 보고 대화가 통할 상대를 찾아드려요. 서로의 얼굴은 매칭된 후에 공개됩니다.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex gap-5">
            <div className="relative z-10 w-10 h-10 rounded-full bg-underline-cream border border-black/10 flex items-center justify-center text-lg shadow-sm">
              <Mail className="w-5 h-5 text-underline-red" />
            </div>
            <div className="flex-1 pt-1">
              <h4 className="font-bold text-underline-text mb-1">금요일 밤 8시, 인연의 편지 열기</h4>
              <p className="text-sm text-underline-text/60 leading-relaxed">
                한 주 동안 기다린 인연이 우편함에 도착합니다. 알림이 울리면 설레는 마음으로 확인해 보세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Corporate Footer */}
      <footer className="bg-[#333333] px-6 py-10 text-white/60 text-[10px] leading-relaxed font-sans">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <p>고객센터 : unicorn6402@bookbla.com</p>
            <p>기업제휴 문의 : unicorn6402@bookbla.com</p>
          </div>

          <div className="w-full h-[1px] bg-white/10 my-4" />

          <div className="space-y-1">
            <p>경기도 성남시 성남대로 1342 AI공학관 617호</p>
            <p>사업자 등록번호 206-88-02996</p>
            <p>주식회사 북블라 대표이사 고도현</p>
            <p>대표번호 070-8065-7296</p>
          </div>

          <div className="flex gap-4 pt-2 text-white/50 text-[10px]">
            <button onClick={() => setActivePolicyModal('terms')} className="hover:text-white transition-colors">이용약관</button>
            <button onClick={() => setActivePolicyModal('privacy')} className="hover:text-white transition-colors">개인정보처리방침</button>
          </div>

          <div className="pt-2 text-white/30">
            Copyright © 2025 언니의인맥 All rights reserved.
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {activePolicyModal === 'terms' ? '서비스 이용약관' : '개인정보 처리방침'}
              </h3>
              <button
                onClick={() => setActivePolicyModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-sm text-gray-700 leading-relaxed">
                {activePolicyModal === 'terms' ? <TermsContent /> : <PrivacyContent />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}