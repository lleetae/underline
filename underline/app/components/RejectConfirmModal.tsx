import React from "react";
import { X } from "lucide-react";

interface RejectConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAccept: () => void;
  nickname: string;
}

export function RejectConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onAccept,
  nickname 
}: RejectConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#FAFAFA] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-[#171717]/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#171717]/40 hover:text-[#171717] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-[#171717] text-center mb-3">
            정말 거절하시겠습니까?
          </h2>
          <div className="space-y-3">
            <p className="text-[#171717]/70 text-sm text-center leading-relaxed font-sans">
              <span className="font-medium text-[#171717]">{nickname}</span>님의 매칭 신청을 거절하면<br />
              <span className="text-[#CC0000] font-medium">영원히 되돌릴 수 없습니다.</span>
            </p>
            <div className="bg-gradient-to-br from-[#CC0000]/5 to-[#CC0000]/10 border border-[#CC0000]/20 rounded-lg p-3">
              <p className="text-xs text-[#171717]/60 text-center font-sans leading-relaxed">
                한 번 더 생각해보시는 건 어떨까요?<br />
                수락하시면 대화를 시작할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onAccept}
            className="w-full py-3 bg-[#171717] text-[#FAFAFA] rounded-lg hover:bg-[#171717]/90 transition-colors font-sans"
          >
            수락하기
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-white border border-[#171717]/20 text-[#171717]/60 rounded-lg hover:bg-[#FAFAFA] hover:text-[#171717] transition-colors font-sans text-sm"
          >
            그래도 거절하기
          </button>
        </div>
      </div>
    </div>
  );
}
