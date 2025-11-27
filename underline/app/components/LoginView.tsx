import React from "react";
import { supabase } from "../lib/supabase";
import { MessageCircle } from "lucide-react";

export function LoginView() {
    const handleKakaoLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: window.location.origin,
            },
        });
    };

    return (
        <div className="w-full min-h-screen bg-[#FCFCFA] flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[var(--primary)]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-[var(--foreground)]/5 rounded-full blur-3xl" />

            <div className="w-full max-w-md space-y-12 relative z-10">
                {/* Logo / Title Area */}
                <div className="text-center space-y-4">
                    <h1 className="font-serif text-4xl text-[var(--foreground)] tracking-tight">
                        Underline
                    </h1>
                    <p className="text-[var(--foreground)]/60 font-sans text-sm leading-relaxed">
                        책 속의 문장으로 이어지는<br />
                        깊이 있는 만남
                    </p>
                </div>

                {/* Login Actions */}
                <div className="space-y-4">
                    <button
                        onClick={handleKakaoLogin}
                        className="w-full bg-[#FEE500] text-[#000000] font-sans font-medium py-3.5 rounded-lg hover:bg-[#FEE500]/90 transition-all duration-300 shadow-lg shadow-[#FEE500]/20 flex items-center justify-center gap-2.5"
                    >
                        <MessageCircle className="w-5 h-5 fill-current" />
                        카카오로 시작하기
                    </button>

                    <div className="text-center">
                        <p className="text-[10px] text-[var(--foreground)]/40 font-sans">
                            계속 진행함으로써 Underline의 이용약관 및<br />
                            개인정보 처리방침에 동의합니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
