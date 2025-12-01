import React from "react";
import { Lock, Copy } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";
import { DecryptedKakaoId } from "../DecryptedKakaoId";
import { supabase } from "../../lib/supabase";

interface Match {
  id: string;
  profileId: string;
  userImage: string;
  nickname: string;
  age: number;
  location: string;
  bookTitle: string;
  isUnlocked: boolean;
  isBlurred?: boolean;
  partnerKakaoId?: string; // Added
}

export function MatchList({
  matches = [],
  onProfileClick
}: {
  matches?: Match[];
  onProfileClick?: (profileId: string, source: "home" | "mailbox", metadata?: { isPenalized?: boolean; isWithdrawn?: boolean; partnerKakaoId?: string; matchId?: string; isUnlocked?: boolean }) => void;
}) {
  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--foreground)]/40 text-sm font-sans">
        <p>아직 매칭된 상대가 없습니다.</p>
      </div>
    );
  }

  const handleCopyContact = async (encryptedId: string) => {
    try {
      // Decrypt first
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error("로그인이 필요합니다");
        return;
      }

      const response = await fetch('/api/decrypt/kakao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ encryptedId })
      });

      if (!response.ok) {
        throw new Error("Decryption failed");
      }

      const data = await response.json();
      const contactInfo = data.decryptedId;

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(contactInfo);
        toast.success("카카오톡 ID가 복사되었습니다");
      } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = contactInfo;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        toast.success("카카오톡 ID가 복사되었습니다");
      }
    } catch (err) {
      console.error("Copy error:", err);
      toast.error("복사에 실패했습니다");
    }
  };

  const handlePayment = (match: Match) => {
    // @ts-ignore
    if (typeof window.AUTHNICE === 'undefined') {
      toast.error("결제 시스템을 불러오지 못했습니다. 새로고침 해주세요.");
      return;
    }

    // @ts-ignore
    window.AUTHNICE.requestPay({
      clientId: process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID || 'S2_ff3bfd3d0db14308b7375e9f74f8b695',
      method: 'card',
      orderId: match.id,
      amount: 9900,
      goodsName: '연락처 잠금해제',
      returnUrl: `${window.location.origin}/api/payments/approve`,
      fnError: function (result: any) {
        toast.error('결제 중 오류가 발생했습니다: ' + result.errorMsg);
      }
    });
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-white border border-[var(--foreground)]/10 rounded-xl p-5 shadow-sm flex flex-col gap-5"
        >
          {/* Match Profile Info */}
          <div
            onClick={() => onProfileClick?.(match.profileId, "mailbox", { partnerKakaoId: match.partnerKakaoId, matchId: match.id, isUnlocked: match.isUnlocked })}
            className="flex items-center gap-3 cursor-pointer hover:bg-[var(--foreground)]/5 p-2 rounded-lg transition-colors -mx-2"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--foreground)]/10 flex-shrink-0">
              <ImageWithFallback
                src={match.userImage}
                alt={match.nickname}
                className={`w-full h-full object-cover ${match.isBlurred ? 'blur-sm' : ''}`}
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-baseline gap-2 mb-0.5">
                <h3 className="font-sans font-bold text-base text-[var(--foreground)]">
                  {match.nickname}
                </h3>
                <span className="text-xs text-[var(--foreground)]/60 font-sans">
                  만 {match.age}세
                </span>
              </div>
              <p className="text-xs text-[var(--foreground)]/50 font-sans">
                {match.location}
              </p>
            </div>
          </div>



          {/* Contact Info Area */}
          <div className="relative bg-white border-2 border-[var(--foreground)]/10 rounded-xl p-4 text-center overflow-hidden">
            {match.isUnlocked ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--foreground)] flex items-center justify-center gap-1">
                  카카오톡 ID: <DecryptedKakaoId encryptedId={match.partnerKakaoId} />
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-1 space-y-1.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-xs font-medium text-[var(--foreground)]/60">연락처 잠금</span>
                </div>
                <p className="text-sm font-bold text-[var(--foreground)] tracking-wider">카카오톡 ID: *******</p>
              </div>
            )}
          </div>

          {/* Action */}
          {!match.isUnlocked && (
            <div className="space-y-2">
              <button
                onClick={() => handlePayment(match)}
                className="w-full bg-[var(--primary)] text-white hover:bg-[#b30000] font-sans font-medium py-3.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20"
              >
                연락처 잠금해제 (9,900원)
              </button>
              <p className="text-[10px] text-center text-[var(--foreground)]/40">
                * 한 명이 결제하면 두 분 모두에게 연락처가 공개됩니다.
              </p>
            </div>
          )}

          {match.isUnlocked && (
            <button
              onClick={() => handleCopyContact(match.partnerKakaoId || "")}
              className="w-full bg-[var(--foreground)] text-white font-sans font-medium py-3 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 hover:bg-[var(--foreground)]/90"
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