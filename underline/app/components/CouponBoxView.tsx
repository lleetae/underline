import React from "react";
import { ArrowLeft, Copy, Ticket } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

interface CouponBoxViewProps {
    freeRevealsCount: number;
    hasWelcomeCoupon: boolean;
    onBack: () => void;
}

export function CouponBoxView({ freeRevealsCount, hasWelcomeCoupon, onBack }: CouponBoxViewProps) {
    const handleCopyLink = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        const shareUrl = `${window.location.origin}?ref=${userId || ''}`;

        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('초대 링크가 복사되었습니다!');
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('링크 복사에 실패했습니다.');
        }
    };

    return (
        <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#FCFCFA] border-b border-[var(--foreground)]/10">
                <div className="flex items-center gap-3 px-6 py-4">
                    <button
                        onClick={onBack}
                        className="p-1 -ml-1 hover:bg-[var(--foreground)]/5 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-[var(--foreground)]" />
                    </button>
                    <h1 className="font-serif text-xl text-[var(--foreground)]">내 쿠폰함</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* Coupon List */}
                <div className="space-y-4 mb-8">
                    {/* Free Reveal Ticket */}
                    <div className="bg-white border border-[var(--foreground)]/10 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#F5F5F0] rounded-full flex items-center justify-center text-xl">
                                    🎁
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--foreground)]">무료 연락처 교환권</h3>
                                    <p className="text-xs text-[var(--foreground)]/60">친구 초대로 받은 선물</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-[var(--primary)]">{freeRevealsCount}</span>
                                <span className="text-sm text-[var(--foreground)]/60 ml-1">장</span>
                            </div>
                        </div>
                        <p className="text-xs text-[var(--foreground)]/40 bg-[var(--foreground)]/5 p-3 rounded-lg">
                            매칭된 상대방의 연락처를 무료로 열람할 수 있습니다.
                        </p>
                    </div>

                    {/* Welcome Coupon */}
                    {hasWelcomeCoupon && (
                        <div className="bg-white border border-red-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                사용 가능
                            </div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-xl">
                                        🎟️
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--foreground)]">연락처 교환 50% 할인</h3>
                                        <p className="text-xs text-[var(--foreground)]/60">첫 만남 응원 쿠폰</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-red-400 bg-red-50 p-3 rounded-lg">
                                첫 연락처 교환 시 4,900원으로 할인됩니다.
                            </p>
                        </div>
                    )}

                    {/* Empty State Message if no coupons */}
                    {(!freeRevealsCount && !hasWelcomeCoupon) && (
                        <div className="text-center py-8 text-[var(--foreground)]/40">
                            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">보유한 쿠폰이 없습니다.</p>
                        </div>
                    )}
                </div>

                {/* Invite Friend Section */}
                <div className="bg-gradient-to-br from-[var(--primary)]/5 to-[var(--primary)]/10 rounded-2xl p-6 border border-[var(--primary)]/20 text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm">
                        💌
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[var(--foreground)] mb-2">
                        친구 초대하고 혜택 받기
                    </h3>
                    <p className="text-sm text-[var(--foreground)]/70 mb-6 leading-relaxed">
                        친구를 초대하면 <span className="font-bold text-[var(--primary)]">무료 교환권</span>을 드려요!<br />
                        친구에게는 <span className="font-bold text-red-500">50% 할인 쿠폰</span>을 선물할 수 있습니다.
                    </p>

                    <button
                        onClick={handleCopyLink}
                        className="w-full py-3.5 bg-white border border-[var(--primary)]/30 text-[var(--primary)] rounded-xl font-bold shadow-sm hover:bg-[var(--primary)]/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Copy className="w-4 h-4" />
                        초대 링크 복사하기
                    </button>
                </div>
            </div>
        </div>
    );
}
