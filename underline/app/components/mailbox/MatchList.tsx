import React from "react";
import { Lock, Link as LinkIcon, Copy } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";

interface Match {
  id: string;
  userImage: string;
  nickname: string;
  age: number;
  location: string;
  bookTitle: string;
  isUnlocked: boolean;
}

export function MatchList({ onProfileClick }: { onProfileClick?: (profileId: string, source: "home" | "mailbox") => void }) {
  // Mock Data - 더미 데이터 추가
  const matches: Match[] = [
    {
      id: "match1",
      userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      nickname: "책읽는여름",
      age: 28,
      location: "서울 성동구",
      bookTitle: "참을 수 없는 존재의 가벼움",
      isUnlocked: false,
    },
    {
      id: "match2",
      userImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
      nickname: "산책하는사람",
      age: 30,
      location: "서울 강남구",
      bookTitle: "데미안",
      isUnlocked: true,
    },
    {
      id: "match3",
      userImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      nickname: "커피애호가",
      age: 27,
      location: "서울 마포구",
      bookTitle: "노르웨이의 숲",
      isUnlocked: false,
    },
  ];

  const handleCopyContact = () => {
    const contactInfo = "underline_lover";

    // Fallback method for browsers that don't support Clipboard API
    const textArea = document.createElement("textarea");
    textArea.value = contactInfo;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      textArea.remove();
      toast.success("카카오톡 ID가 복사되었습니다", {
        duration: 2000,
      });
    } catch (err) {
      textArea.remove();
      toast.error("복사에 실패했습니다");
    }
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-white border border-[#1A3C34]/10 rounded-xl p-5 shadow-sm flex flex-col gap-5"
        >
          {/* Match Profile Info */}
          <div
            onClick={() => onProfileClick?.(match.id, "mailbox")}
            className="flex items-center gap-3 cursor-pointer hover:bg-[#1A3C34]/5 p-2 rounded-lg transition-colors -mx-2"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border border-[#1A3C34]/10 flex-shrink-0">
              <ImageWithFallback
                src={match.userImage}
                alt={match.nickname}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-baseline gap-2 mb-0.5">
                <h3 className="font-sans font-bold text-base text-[#1A3C34]">
                  {match.nickname}
                </h3>
                <span className="text-xs text-[#1A3C34]/60 font-sans">
                  만 {match.age}세
                </span>
              </div>
              <p className="text-xs text-[#1A3C34]/50 font-sans">
                {match.location}
              </p>
            </div>
          </div>

          {/* Context */}
          <div className="text-center space-y-1 border-t border-[#1A3C34]/10 pt-6">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#1A3C34]/60 font-sans">
              <LinkIcon className="w-3 h-3 text-[#D4AF37]" />
              <span>매칭된 책</span>
            </div>
            <p className="font-serif text-lg text-[#1A3C34]">
              {match.bookTitle}
            </p>
          </div>

          {/* Contact Info Area */}
          <div className="relative bg-[#1A3C34]/5 rounded-lg p-4 text-center overflow-hidden">
            {match.isUnlocked ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1A3C34]">카카오톡 ID: underline_lover</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-1 space-y-1.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-xs font-medium text-[#1A3C34]/60">연락처 잠금</span>
                </div>
                <p className="text-sm font-bold text-[#1A3C34] tracking-wider">카카오톡 ID: *******</p>
              </div>
            )}
          </div>

          {/* Action */}
          {!match.isUnlocked && (
            <div className="space-y-2">
              <button className="w-full border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white font-sans font-medium py-3 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2">
                연락처 잠금해제 (9,900원)
              </button>
              <p className="text-[10px] text-center text-[#1A3C34]/40">
                * 한 명이 결제하면 두 분 모두에게 연락처가 공개됩니다.
              </p>
            </div>
          )}

          {match.isUnlocked && (
            <button
              onClick={handleCopyContact}
              className="w-full bg-[#1A3C34] text-white font-sans font-medium py-3 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 hover:bg-[#1A3C34]/90"
            >
              <Copy className="w-4 h-4" />
              연락처 복사하기
            </button>
          )}
        </div>
      ))}
    </div>
  );
}