import React from "react";
import { X, MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onSignUpClick: () => void;
}) {

  if (!isOpen) return null;

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

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
        <div className="relative bg-[var(--foreground)] px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="font-serif text-2xl mb-2">Underline</h2>
          <p className="text-sm text-white/80 font-sans">
            책으로 만나는 특별한 인연
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="space-y-4 mb-6">
            <button
              onClick={handleKakaoLogin}
              className="w-full bg-[#FEE500] text-[#000000] font-sans font-medium py-3.5 rounded-lg hover:bg-[#FEE500]/90 transition-all duration-300 shadow-lg shadow-[#FEE500]/20 flex items-center justify-center gap-2.5"
            >
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                <MessageCircle className="w-5 h-5 fill-current" />
                <span className="font-medium">카카오로 3초 만에 시작하기</span>
              </span></button>
          </div>

          {/* Additional Info */}
          <p className="text-center text-xs text-[var(--foreground)]/40 font-sans mt-6">
            계속 진행함으로써 Underline의 이용약관 및<br />
            개인정보 처리방침에 동의합니다.
          </p>
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