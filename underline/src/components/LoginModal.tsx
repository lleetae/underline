import React, { useState } from "react";
import { X, Lock, Mail, Phone, Check } from "lucide-react";
import { toast } from "sonner@2.0.3";

export function LoginModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  onSignUpClick 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onLoginSuccess: () => void;
  onSignUpClick: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [timer, setTimer] = useState(0);

  // Timer effect
  React.useEffect(() => {
    if (timer > 0 && isOpen) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isOpen]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setPhoneNumber("");
      setVerificationCode("");
      setIsCodeSent(false);
      setGeneratedCode("");
      setTimer(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
    setIsCodeSent(false);
    setVerificationCode("");
  };

  const handleSendCode = () => {
    const numbers = phoneNumber.replace(/[^\d]/g, '');
    if (numbers.length !== 11) {
      toast.error("올바른 전화번호를 입력해주세요");
      return;
    }

    // 실제 구현시: SMS API 호출 및 DB에서 전화번호 존재 확인
    // 여기서는 모의 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setIsCodeSent(true);
    setTimer(180); // 3분
    
    toast.success(`인증번호가 발송되었습니다\n(테스트 코드: ${code})`);
  };

  const handleVerifyCode = () => {
    if (!verificationCode) {
      toast.error("인증번호를 입력해주세요");
      return;
    }

    // 실제 구현시: 서버에서 인증번호 검증 및 로그인 처리
    if (verificationCode === generatedCode) {
      toast.success("로그인 되었습니다!");
      onLoginSuccess();
      onClose();
    } else {
      toast.error("인증번호가 일치하지 않습니다");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSignUpClick = () => {
    onClose();
    onSignUpClick();
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
        <div className="relative bg-gradient-to-br from-[#1A3C34] to-[#2A4C44] px-6 py-8 text-white">
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
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                전화번호
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A3C34]/40" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                    placeholder="010-0000-0000"
                    maxLength={13}
                  />
                </div>
                <button
                  onClick={handleSendCode}
                  disabled={phoneNumber.replace(/[^\d]/g, '').length !== 11}
                  className="px-4 py-2.5 bg-[#1A3C34] text-white hover:bg-[#1A3C34]/90 rounded-lg transition-all duration-300 font-sans text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isCodeSent ? "재발송" : "인증번호"}
                </button>
              </div>
            </div>

            {/* Verification Code Input */}
            {isCodeSent && (
              <div className="animate-fadeIn">
                <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
                  인증번호
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A3C34]/40" />
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                      className="w-full pl-10 pr-16 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                      placeholder="6자리 숫자"
                      maxLength={6}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && verificationCode.length === 6) {
                          handleVerifyCode();
                        }
                      }}
                    />
                    {timer > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#D4AF37] font-mono">
                        {formatTime(timer)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 6}
                    className="px-5 py-2.5 bg-[#D4AF37] text-white hover:bg-[#D4AF37]/90 rounded-lg transition-all duration-300 flex items-center gap-1.5 font-sans text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#D4AF37]/20"
                  >
                    로그인
                  </button>
                </div>
                <p className="text-xs text-[#1A3C34]/40 mt-1.5 font-sans">
                  인증번호를 받지 못하셨나요? 재발송을 눌러주세요
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-[#1A3C34]/10" />
            <span className="text-xs text-[#1A3C34]/40 font-sans">또는</span>
            <div className="h-px flex-1 bg-[#1A3C34]/10" />
          </div>

          {/* Sign Up Button */}
          <button
            onClick={handleSignUpClick}
            className="w-full border-2 border-[#1A3C34] text-[#1A3C34] font-sans font-medium py-3 rounded-lg hover:bg-[#1A3C34]/5 transition-all duration-300"
          >
            회원가입
          </button>

          {/* Additional Info */}
          <p className="text-center text-xs text-[#1A3C34]/40 font-sans mt-6">
            전화번호로 간편하게 로그인하세요
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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}