import React from "react";
import { Lock, Copy, Star } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";
import { DecryptedKakaoId } from "../DecryptedKakaoId";
import { supabase } from "../../lib/supabase";
import { CouponSelectionModal } from "../CouponSelectionModal";

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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useState } from "react";

export function MatchList({
  matches = [],
  onProfileClick
}: {
  matches?: Match[];
  onProfileClick?: (profileId: string, source: "home" | "mailbox", metadata?: { isPenalized?: boolean; isWithdrawn?: boolean; partnerKakaoId?: string; matchId?: string; isUnlocked?: boolean }) => void;
}) {
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [targetKakaoId, setTargetKakaoId] = useState<string | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [memberInfo, setMemberInfo] = useState<{ id: string; free_reveals_count: number; has_welcome_coupon: boolean } | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Manner Rating State
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const openRatingModal = (match: Match) => {
    setSelectedMatch(match);
    setRatingScore(5);
    setRatingComment("");
    setRatingModalOpen(true);
  };

  const submitMannerRating = async () => {
    if (!selectedMatch) return;

    try {
      setIsSubmittingRating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("로그인이 필요합니다");
        return;
      }

      // 1. Get rated user's auth_id
      const { data: ratedMember, error: memberError } = await supabase
        .from('member')
        .select('auth_id')
        .eq('id', selectedMatch.profileId)
        .single();

      if (memberError || !ratedMember) {
        console.error("Error fetching rated member:", memberError);
        toast.error("상대방 정보를 찾을 수 없습니다.");
        setIsSubmittingRating(false);
        return;
      }

      const ratedAuthId = ratedMember.auth_id;

      // Check if already rated (Optional, but good UX)
      const { count } = await supabase
        .from('manner_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('rater_id', session.user.id)
        .eq('rated_id', ratedAuthId);

      if (count && count > 0) {
        toast.error("이미 평가한 상대입니다.");
        setRatingModalOpen(false);
        return;
      }

      const { error } = await supabase
        .from('manner_ratings')
        .insert({
          rater_id: session.user.id,
          rated_id: ratedAuthId,
          rating: ratingScore,
          comment: ratingComment
        });

      if (error) throw error;

      toast.success("매너 평가가 등록되었습니다!");
      setRatingModalOpen(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("평가 등록에 실패했습니다.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

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

      setTargetKakaoId(contactInfo);
      setCopyModalOpen(true);

    } catch (err) {
      console.error("Copy error:", err);
      toast.error("연락처 정보를 불러오는데 실패했습니다");
    }
  };

  const handleConfirmCopy = async () => {
    if (!targetKakaoId) return;

    try {
      // Robust Copy Logic
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetKakaoId);
      } else {
        // Fallback for older browsers / webviews
        const textArea = document.createElement("textarea");
        textArea.value = targetKakaoId;
        textArea.style.position = "fixed";
        textArea.style.left = "0";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        textArea.style.pointerEvents = "none";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } catch (err) {
          throw new Error("Fallback copy failed");
        } finally {
          document.body.removeChild(textArea);
        }
      }

      toast.success("카카오톡 ID가 복사되었습니다");
      setCopyModalOpen(false);
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("복사에 실패했습니다. 화면의 ID를 직접 복사해주세요.");
    }
  };

  const handlePayment = async (match: Match) => {
    try {
      // 1. Get current user's member ID and coupons
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("로그인이 필요합니다.");
        return;
      }

      const { data: member, error } = await supabase
        .from('member')
        .select('id, free_reveals_count, has_welcome_coupon')
        .eq('auth_id', session.user.id)
        .single();

      if (error || !member) {
        console.error("Error fetching member for payment:", error);
        toast.error("회원 정보를 찾을 수 없습니다.");
        return;
      }

      setMemberInfo(member);
      setSelectedMatch(match);

      // Check if user has ANY coupons
      if ((member.free_reveals_count || 0) > 0 || member.has_welcome_coupon) {
        setShowCouponModal(true);
      } else {
        // No coupons, proceed to full price payment
        processPayment('none', member, match);
      }
    } catch (e) {
      console.error("Payment handler error:", e);
      toast.error("결제 시작 중 오류가 발생했습니다.");
    }
  };

  const handleCouponSelect = (type: 'free' | 'discount' | 'none') => {
    setShowCouponModal(false);
    if (!memberInfo || !selectedMatch) return;

    if (type === 'free') {
      useFreeReveal(memberInfo, selectedMatch);
    } else {
      processPayment(type, memberInfo, selectedMatch);
    }
  };

  const useFreeReveal = async (member: { id: string; free_reveals_count: number }, match: Match) => {
    if (confirm(`무료 열람권이 ${member.free_reveals_count}개 있습니다. 사용하시겠습니까?`)) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          toast.error("로그인이 필요합니다.");
          return;
        }

        const response = await fetch('/api/payments/use-free-reveal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ matchId: match.id }),
        });

        const result = await response.json();
        if (response.ok && result.success) {
          toast.success(`무료 열람권을 사용했습니다. (남은 개수: ${result.remaining}개)`);
          window.location.reload();
        } else {
          toast.error(result.error || "무료 열람권 사용 실패");
        }
      } catch (e) {
        console.error(e);
        toast.error("오류가 발생했습니다.");
      }
    }
  };

  const processPayment = (type: 'discount' | 'none', member: { id: string; has_welcome_coupon: boolean }, match: Match) => {
    // @ts-ignore
    if (typeof window.AUTHNICE === 'undefined') {
      toast.error("결제 시스템을 불러오지 못했습니다. 새로고침 해주세요.");
      return;
    }

    let amount = 19900;
    let goodsName = '연락처 잠금해제';

    if (type === 'discount' && member.has_welcome_coupon) {
      amount = 9900;
      goodsName = '연락처 잠금해제 (첫 만남 50% 할인)';
    }

    // Construct Order ID: matchRequestId_payerMemberId
    const orderId = `${match.id}_${member.id}`;
    console.log("MatchList: Requesting payment with orderId:", orderId);

    // @ts-ignore
    window.AUTHNICE.requestPay({
      clientId: process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID || 'S2_ff3bfd3d0db14308b7375e9f74f8b695',
      method: 'card',
      orderId: orderId,
      amount: amount,
      goodsName: goodsName,
      returnUrl: `${window.location.origin}/api/payments/approve`,
      fnError: function (result: any) {
        console.error("NicePayments error:", result);
        toast.error('결제 중 오류가 발생했습니다: ' + result.errorMsg);
      }
    });
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <CouponSelectionModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        freeRevealsCount={memberInfo?.free_reveals_count || 0}
        hasWelcomeCoupon={memberInfo?.has_welcome_coupon || false}
        onSelectCoupon={handleCouponSelect}
      />
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
                연락처 잠금해제 (19,900원)
              </button>
              <p className="text-[10px] text-center text-[var(--foreground)]/40">
                * 한 명이 결제하면 두 분 모두에게 연락처가 공개됩니다.
              </p>
            </div>
          )}

          {match.isUnlocked && (
            <div className="space-y-2">
              <button
                onClick={() => handleCopyContact(match.partnerKakaoId || "")}
                className="w-full bg-[var(--foreground)] text-white font-sans font-medium py-3 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 hover:bg-[var(--foreground)]/90"
              >
                <Copy className="w-4 h-4" />
                연락처 복사하기
              </button>
              <button
                onClick={() => openRatingModal(match)}
                className="w-full bg-white border border-[var(--primary)] text-[var(--primary)] font-sans font-medium py-3 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 hover:bg-[var(--primary)]/5"
              >
                <Star className="w-4 h-4" />
                상대방 매너 평가하기
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Copy Confirm Modal */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-center">카카오톡 ID 복사</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">아래 ID를 복사하여 카카오톡 친구추가 하세요</p>
              <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/50">
                <p className="text-xl font-bold tracking-wide select-all">{targetKakaoId}</p>
              </div>
            </div>
            <Button
              onClick={handleConfirmCopy}
              className="w-full h-12 text-base font-bold bg-[#FAE100] text-[#371D1E] hover:bg-[#FAE100]/90"
            >
              <Copy className="w-4 h-4 mr-2" />
              ID 복사하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manner Rating Modal */}
      <Dialog open={ratingModalOpen} onOpenChange={setRatingModalOpen}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-sans text-xl">매너 평가</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 py-2">
            <div className="text-center space-y-1">
              <p className="text-sm text-[var(--foreground)]/60 font-sans">
                <span className="font-bold text-[var(--foreground)]">{selectedMatch?.nickname}</span>님과의 대화는 어떠셨나요?
              </p>
              <p className="text-xs text-[var(--foreground)]/40 font-sans">
                솔직한 후기가 쌓이면 매칭 정확도가 올라갑니다.
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setRatingScore(score)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${score <= ratingScore
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                      }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment Area */}
            <div className="space-y-2">
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="상대방의 매너에 대해 솔직하게 적어주세요. (선택사항)"
                maxLength={500}
                className="w-full h-32 p-3 rounded-xl border border-[var(--foreground)]/10 text-sm font-sans resize-none focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/50"
              />
              <div className="text-right text-xs text-[var(--foreground)]/40 font-sans">
                {ratingComment.length} / 500
              </div>
            </div>

            <Button
              onClick={submitMannerRating}
              disabled={isSubmittingRating}
              className="w-full h-12 text-base font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 rounded-xl"
            >
              {isSubmittingRating ? "등록 중..." : "평가 등록하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}