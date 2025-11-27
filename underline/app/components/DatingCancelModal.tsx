import React from "react";
import { X, AlertTriangle, Heart } from "lucide-react";

interface DatingCancelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function DatingCancelModal({ isOpen, onClose, onConfirm }: DatingCancelModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl transform transition-all scale-100">
                {/* Header */}
                <div className="bg-[#171717] px-6 py-8 flex flex-col items-center justify-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-[#CC0000]" />
                        <h2 className="font-serif text-2xl text-white tracking-wide">
                            소개팅 신청 취소
                        </h2>
                        <p className="text-white/70 font-sans text-sm">
                            정말 이번 주 소개팅을 포기하시겠습니까?
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Message Box */}
                    <div className="bg-[#FAFAFA] border border-[#CC0000]/30 rounded-xl p-5 text-center space-y-3">
                        <Heart className="w-5 h-5 text-[#CC0000] mx-auto fill-current" />
                        <p className="text-[#171717] font-sans text-sm leading-relaxed">
                            이번 주 금요일, 당신과 같은 책을 좋아하는 사람과의 특별한 만남이 기다리고 있어요.
                        </p>
                        <p className="text-[#171717]/60 font-sans text-xs">
                            정말 포기하시겠습니까?
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={onClose}
                            className="w-full bg-[#CC0000] text-white font-sans font-medium py-3.5 rounded-xl hover:bg-[#CC0000]/90 transition-colors shadow-lg shadow-[#CC0000]/20"
                        >
                            계속 참여하기
                        </button>
                        <button
                            onClick={() => {
                                console.log("Modal cancel button clicked, calling onConfirm");
                                onConfirm();
                            }}
                            className="w-full bg-white border border-[#171717]/10 text-[#171717]/40 font-sans font-medium py-3.5 rounded-xl hover:bg-[#171717]/5 hover:text-[#171717]/60 transition-colors"
                        >
                            취소하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
