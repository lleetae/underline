import React from "react";
import { Lock, Link as LinkIcon, Copy } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner@2.0.3";

interface Match {
  id: string;
  userImage: string;
  matchImage: string;
  bookTitle: string;
  isUnlocked: boolean;
}

export function MatchList({ onProfileClick }: { onProfileClick?: (profileId: string, source: "home" | "mailbox") => void }) {
  // Mock Data - 더미 데이터 추가
  const matches: Match[] = [
    {
      id: "match1",
      userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      matchImage: "https://images.unsplash.com/photo-1761014219896-84159aa7c664",
      bookTitle: "참을 수 없는 존재의 가벼움",
      isUnlocked: false,
    },
    {
      id: "match2",
      userImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
      matchImage: "https://images.unsplash.com/photo-1761014219896-84159aa7c664",
      bookTitle: "데미안",
      isUnlocked: true,
    },
    {
      id: "match3",
      userImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      matchImage: "https://images.unsplash.com/photo-1761014219896-84159aa7c664",
      bookTitle: "노르웨이의 숲",
      isUnlocked: false,
    },
  ];

  const handleCopyContact = () => {
    const contactInfo = "010-1234-5678\nKakao: underline_lover";
    
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
      toast.success("연락처가 복사되었습니다", {
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
          {/* Avatars & Connection */}
          <div className="flex items-center justify-center gap-4 relative">
            <div 
              onClick={() => onProfileClick?.(match.id, "mailbox")}
              className="w-12 h-12 rounded-full overflow-hidden border border-[#1A3C34]/10 z-10 bg-white cursor-pointer hover:ring-2 hover:ring-[#D4AF37] transition-all"
            >
              <ImageWithFallback
                src={match.userImage}
                alt="Match"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Connection Line */}
            <div className="h-px flex-1 bg-[#D4AF37]/40 relative flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            </div>

            <div className="w-12 h-12 rounded-full overflow-hidden border border-[#1A3C34]/10 z-10 bg-white">
              <ImageWithFallback
                src={match.matchImage}
                alt="Me"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Context */}
          <div className="text-center space-y-1">
             <div className="flex items-center justify-center gap-1.5 text-xs text-[#1A3C34]/60 font-sans">
                <LinkIcon className="w-3 h-3 text-[#D4AF37]" />
                <span>Connected by</span>
             </div>
             <p className="font-serif text-lg text-[#1A3C34]">
               {match.bookTitle}
             </p>
          </div>

          {/* Contact Info Area */}
          <div className="relative bg-[#1A3C34]/5 rounded-lg p-4 text-center overflow-hidden">
            {match.isUnlocked ? (
               <div className="space-y-1">
                 <p className="text-sm font-bold text-[#1A3C34]">010-1234-5678</p>
                 <p className="text-xs text-[#1A3C34]/60">Kakao: underline_lover</p>
               </div>
            ) : (
               <>
                <div className="filter blur-sm select-none opacity-50 space-y-1">
                    <p className="text-sm font-bold text-[#1A3C34]">010-XXXX-XXXX</p>
                    <p className="text-xs text-[#1A3C34]/60">Kakao: XXXXXX</p>
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center z-20">
                   <Lock className="w-5 h-5 text-[#1A3C34]/40" />
                </div>
               </>
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