import React from "react";
import { X, Heart, AlertTriangle } from "lucide-react";

export function CancelRecruitmentModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#1A3C34] to-[#2A4C44] px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-[#D4AF37]" />
            <h2 className="font-serif text-2xl">소개팅 신청 취소</h2>
          </div>
          <p className="text-sm text-white/80 font-sans">
            정말 이번 주 소개팅을 포기하시겠습니까?
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Warning Message */}
          <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border-2 border-[#D4AF37]/30 rounded-xl p-5 mb-6">
            <div className="flex gap-3">
              <Heart className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#1A3C34] font-sans leading-relaxed mb-3">
                  이번 주 금요일, 당신과 같은 책을 좋아하는
                  사람과의 특별한 만남이 기다리고 있어요.
                </p>
                <p className="text-sm text-[#1A3C34]/70 font-sans leading-relaxed">
                  정말 포기하시겠습니까?
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-[#D4AF37] text-white rounded-lg font-sans font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 shadow-lg shadow-[#D4AF37]/30"
            >
              계속 참여하기
            </button>
            <button
              onClick={onConfirm}
              className="w-full py-3 border-2 border-[#1A3C34]/20 text-[#1A3C34]/60 rounded-lg font-sans font-medium hover:bg-[#1A3C34]/5 transition-colors text-sm"
            >
              취소하기
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}