import React from "react";
import { X, Ticket } from "lucide-react";

interface CouponSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    freeRevealsCount: number;
    hasWelcomeCoupon: boolean;
    onSelectCoupon: (type: 'free' | 'discount' | 'none') => void;
}

export function CouponSelectionModal({
    isOpen,
    onClose,
    freeRevealsCount,
    hasWelcomeCoupon,
    onSelectCoupon,
}: CouponSelectionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#FCFCFA] rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-xl text-[var(--foreground)]">쿠폰 선택</h2>
                    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    {/* Free Reveal Option */}
                    {freeRevealsCount > 0 && (
                        <button
                            onClick={() => onSelectCoupon('free')}
                            className="w-full bg-white border border-[var(--primary)]/20 rounded-xl p-4 flex items-center justify-between hover:bg-[var(--primary)]/5 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#F5F5F0] rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                    🎁
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--foreground)]">무료 연락처 교환권</h3>
                                    <p className="text-xs text-[var(--foreground)]/60">보유: {freeRevealsCount}장</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-[var(--primary)]">0원</span>
                            </div>
                        </button>
                    )}

                    {/* 50% Discount Option */}
                    {hasWelcomeCoupon && (
                        <button
                            onClick={() => onSelectCoupon('discount')}
                            className="w-full bg-white border border-red-100 rounded-xl p-4 flex items-center justify-between hover:bg-red-50 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                    🎟️
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--foreground)]">50% 할인 쿠폰</h3>
                                    <p className="text-xs text-[var(--foreground)]/60">보유: 1장</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-[var(--foreground)]/40 line-through block">9,900원</span>
                                <span className="text-lg font-bold text-red-500">4,950원</span>
                            </div>
                        </button>
                    )}

                    {/* No Coupon Option */}
                    <button
                        onClick={() => onSelectCoupon('none')}
                        className="w-full bg-white border border-[var(--foreground)]/10 rounded-xl p-4 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-xl text-gray-400">
                                <Ticket className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--foreground)]">쿠폰 사용 안 함</h3>
                                <p className="text-xs text-[var(--foreground)]/60">일반 결제</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-bold text-[var(--foreground)]">9,900원</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
