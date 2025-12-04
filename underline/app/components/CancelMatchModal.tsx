import React from "react";
import { X, AlertCircle } from "lucide-react";

export function CancelMatchModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nickname: string;
  sentence: string;
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
        <div className="relative bg-gradient-to-br from-[var(--foreground)] to-[#2A4C44] px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-[var(--primary)]" />
            <h2 className="font-sans text-2xl">매칭 신청 취소</h2>
          </div>
          <p className="text-sm text-white/80 font-sans">
            정말 취소하시겠습니까?
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Info Box */}
          <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border-2 border-[var(--primary)]/30 rounded-xl p-5 mb-6">
            <p className="text-xs text-[var(--foreground)] font-sans leading-relaxed mb-2 font-medium">
              💡 <span className="font-medium">알아두세요</span>
            </p>
            <ul className="space-y-1.5 text-xs text-[var(--foreground)] font-sans">
              <li>• 취소하면 상대방의 받은 편지함에서 사라집니다</li>
              <li>• 같은 프로필에 다시 신청할 수 있습니다</li>
              <li>• 상대방이 이미 확인했다면 아쉬움이 남을 수 있어요</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-[var(--primary)] text-white rounded-lg font-sans font-medium hover:bg-[var(--primary)]/90 transition-all duration-300 shadow-lg shadow-[var(--primary)]/30"
            >
              계속 신청하기
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 border-2 border-[var(--foreground)]/20 text-[var(--foreground)]/60 rounded-lg font-sans font-medium hover:bg-[var(--foreground)]/5 transition-colors"
            >
              취소할게요
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