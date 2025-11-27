import React, { useState, useEffect } from "react";
import { MapPin, BookOpen } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface UserProfile {
  id: string;
  nickname: string;
  age: number;
  location: string;
  photos: string[];
  bio: string;
  bookTitle: string;
  bookReview: string;
  reviewExcerpt: string;
}

export function HomeDatingView({ onProfileClick }: {
  onProfileClick?: (profileId: string, source?: "home" | "mailbox") => void;
  isSignedUp?: boolean;
  onShowLoginModal?: () => void;
}) {
  // Countdown timer for dating period end
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const profiles: UserProfile[] = [
    {
      id: "1",
      nickname: "책읽는소희",
      age: 26,
      location: "성수동",
      photos: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330"],
      bio: "책을 좋아하는 소희입니다. 다양한 장르의 책을 읽으며 삶의 의미를 찾아가는 중입니다.",
      bookTitle: "참을 수 없는 존재의 가벼움",
      bookReview: "가벼움과 무거움 사이에서 인생의 의미를 찾아가는 여정...",
      reviewExcerpt: "가벼움과 무거움 사이에서 인생의 의미를 찾아가는 여정. 우연과 필연에 대한 철학적 사유가 깊은 울림을 줍니다.",
    },
    {
      id: "2",
      nickname: "민수",
      age: 28,
      location: "한남동",
      photos: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"],
      bio: "독서와 음악을 즐기는 민수입니다. 새로운 사람들과의 만남을 통해 다양한 경험을 쌓고 있습니다.",
      bookTitle: "데미안",
      bookReview: "새는 알에서 나오려고 투쟁한다. 알은 세계다...",
      reviewExcerpt: "새는 알에서 나오려고 투쟁한다. 알은 세계다. 태어나려는 자는 하나의 세계를 깨뜨려야 한다.",
    },
    {
      id: "3",
      nickname: "지은",
      age: 25,
      location: "연남동",
      photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb"],
      bio: "예술을 사랑하는 지은입니다. 창의적인 생각과 표현을 통해 삶의 가치를 찾고 있습니다.",
      bookTitle: "달과 6펜스",
      bookReview: "평범한 삶을 버리고 예술을 선택한 한 남자의 이야기...",
      reviewExcerpt: "달을 보는 사람과 6펜스를 보는 사람. 우리는 각자 다른 것을 추구하며 살아갑니다.",
    },
    {
      id: "4",
      nickname: "현우",
      age: 29,
      location: "망원동",
      photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e"],
      bio: "철학을 연구하는 현우입니다. 자유와 통제, 진실과 거짓에 대한 깊은 성찰을 통해 삶의 방향을 찾고 있습니다.",
      bookTitle: "1984",
      bookReview: "자유와 통제, 진실과 거짓에 대한 깊은 성찰...",
      reviewExcerpt: "자유는 2+2=4라고 말할 수 있는 자유다. 이것이 인정되면 다른 모든 것은 따라온다.",
    },
    {
      id: "5",
      nickname: "서연",
      age: 27,
      location: "이태원",
      photos: ["https://images.unsplash.com/photo-1438761681033-6461ffad8d80"],
      bio: "여행과 음악을 즐기는 서연입니다. 새로운 문화와 경험을 통해 삶의 풍미를 찾아가는 중입니다.",
      bookTitle: "연금술사",
      bookReview: "자신의 운명을 찾아 떠나는 소년의 여정이 주는 감동...",
      reviewExcerpt: "누군가 무언가를 간절히 원할 때 온 우주가 그 소망이 실현되도록 도와준다.",
    },
    {
      id: "6",
      nickname: "태양",
      age: 30,
      location: "성수동",
      photos: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"],
      bio: "자연과 여행을 사랑하는 태양입니다. 자연의 아름다움을 찾아가는 중이며, 삶의 가치를 깊이 생각하고 있습니다.",
      bookTitle: "어린 왕자",
      bookReview: "가장 중요한 것은 눈에 보이지 않는다는 진리...",
      reviewExcerpt: "가장 중요한 것은 눈에 보이지 않아. 마음으로만 볼 수 있어.",
    },
  ];

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#FCFCFA] border-b border-[#1A3C34]/10">
        <div className="flex items-center justify-center px-6 py-4">
          <h1 className="font-serif text-2xl text-[#1A3C34] tracking-wide">
            Underline
          </h1>
        </div>

        {/* Floating Badge - Dating Period Timer */}
        <div className="px-6 pb-3">
          <div className="bg-gradient-to-r from-[#D4AF37] to-[#C9A641] text-white px-4 py-2 rounded-full shadow-lg shadow-[#D4AF37]/30 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-sans font-medium tracking-wide">
              소개팅 기간 종료까지 {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Feed */}
      <div className="flex-1 overflow-y-auto pb-24 px-6 py-4">
        <div className="grid grid-cols-1 gap-4">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => onProfileClick?.(profile.id)}
              className="bg-white border border-[#1A3C34]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
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
                      <span className="text-sm font-sans">{profile.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio and Book Review Section */}
              <div className="p-5 bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] space-y-4">
                {/* Bio */}
                <div>
                  <h4 className="text-xs text-[#1A3C34]/50 font-sans mb-2">자기소개</h4>
                  <p className="font-sans text-[#1A3C34] leading-relaxed text-sm">
                    {profile.bio}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#1A3C34]/10" />

                {/* Book Review */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                    <h4 className="font-serif text-sm text-[#1A3C34]/80">
                      {profile.bookTitle}
                    </h4>
                  </div>
                  <p className="font-serif text-[#1A3C34] leading-relaxed text-sm italic">
                    "{profile.reviewExcerpt}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Hint */}
        <div className="text-center py-8">
          <p className="text-sm text-[#1A3C34]/40 font-sans">
            더 많은 프로필이 준비 중입니다
          </p>
        </div>
      </div>
    </div>
  );
}