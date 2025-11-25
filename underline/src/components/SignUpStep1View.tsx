import React, { useState } from "react";
import { ArrowLeft, Check, Lock, Plus, Shield, X, Phone } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner@2.0.3";

interface PhotoSlot {
  id: string;
  url: string | null;
}

interface Step1Data {
  phoneNumber: string;
  nickname: string;
  gender: "male" | "female" | null;
  birthDate: string;
  location: string;
  religion: string;
  height: string;
  smoking: string;
  drinking: string;
  bio: string;
  kakaoId: string;
  photos: PhotoSlot[];
}

export function SignUpStep1View({ 
  onNext, 
  onBack,
  initialData 
}: { 
  onNext: (data: Step1Data) => void; 
  onBack?: () => void;
  initialData?: Partial<Step1Data>;
}) {
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [timer, setTimer] = useState(0);
  
  const [nickname, setNickname] = useState(initialData?.nickname || "");
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | null>(initialData?.gender || null);
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [religion, setReligion] = useState(initialData?.religion || "");
  const [height, setHeight] = useState(initialData?.height || "");
  const [smoking, setSmoking] = useState(initialData?.smoking || "");
  const [drinking, setDrinking] = useState(initialData?.drinking || "");
  const [bio, setBio] = useState(initialData?.bio || "");
  const [kakaoId, setKakaoId] = useState(initialData?.kakaoId || "");
  const [photos, setPhotos] = useState<PhotoSlot[]>(initialData?.photos || [
    { id: "1", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330" },
    { id: "2", url: null },
    { id: "3", url: null },
    { id: "4", url: null },
    { id: "5", url: null },
  ]);

  // Timer effect
  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

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
    setIsPhoneVerified(false);
    setVerificationCode("");
  };

  const handleSendCode = () => {
    const numbers = phoneNumber.replace(/[^\d]/g, '');
    if (numbers.length !== 11) {
      toast.error("올바른 전화번호를 입력해주세요");
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setIsCodeSent(true);
    setTimer(180);
    
    toast.success(`인증번호가 발송되었습니다\n(테스트 코드: ${code})`);
  };

  const handleVerifyCode = () => {
    if (!verificationCode) {
      toast.error("인증번호를 입력해주세요");
      return;
    }

    if (verificationCode === generatedCode) {
      setIsPhoneVerified(true);
      setTimer(0);
      toast.success("전화번호 인증이 완료되었습니다");
    } else {
      toast.error("인증번호가 일치하지 않습니다");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckNickname = () => {
    if (nickname.trim()) {
      setIsNicknameChecked(true);
      toast.success("사용 가능한 닉네임입니다");
    } else {
      toast.error("닉네임을 입력해주세요");
    }
  };

  const handleAddPhoto = (id: string) => {
    const uploadedCount = photos.filter(p => p.url !== null).length;
    if (uploadedCount >= 5) {
      toast.error("최대 5장까지 등록할 수 있습니다");
      return;
    }
    toast.info("사진 업로드 기능은 준비 중입니다");
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.map(photo => 
      photo.id === id ? { ...photo, url: null } : photo
    ));
  };

  const handleNext = () => {
    if (!isPhoneVerified) {
      toast.error("전화번호 인증을 완료해주세요");
      return;
    }
    if (!nickname || !isNicknameChecked) {
      toast.error("닉네임을 확인해주세요");
      return;
    }
    if (!gender) {
      toast.error("성별을 선택해주세요");
      return;
    }
    if (!birthDate) {
      toast.error("생년월일을 입력해주세요");
      return;
    }
    if (!location) {
      toast.error("지역을 선택해주세요");
      return;
    }
    if (!religion) {
      toast.error("종교를 선택해주세요");
      return;
    }
    if (!height) {
      toast.error("키를 입력해주세요");
      return;
    }
    if (!smoking) {
      toast.error("흡연 여부를 선택해주세요");
      return;
    }
    if (!drinking) {
      toast.error("음주 여부를 선택해주세요");
      return;
    }
    if (!bio) {
      toast.error("자기소개를 입력해주세요");
      return;
    }
    if (!kakaoId) {
      toast.error("카카오톡 ID를 입력해주세요");
      return;
    }
    const uploadedCount = photos.filter(p => p.url !== null).length;
    if (uploadedCount < 1) {
      toast.error("프로필 사진을 최소 1장 이상 등록해주세요");
      return;
    }

    onNext({
      phoneNumber,
      nickname,
      gender,
      birthDate,
      location,
      religion,
      height,
      smoking,
      drinking,
      bio,
      kakaoId,
      photos
    });
  };

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#FCFCFA] border-b border-[#1A3C34]/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button className="p-1 hover:bg-[#1A3C34]/5 rounded-full transition-colors" onClick={onBack}>
              <ArrowLeft className="w-5 h-5 text-[#1A3C34]" />
            </button>
            <h1 className="font-serif text-2xl text-[#1A3C34]">회원가입</h1>
          </div>
          <div className="text-sm font-sans text-[#1A3C34]/60">1/2</div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Phone Number Verification */}
          <div className="bg-gradient-to-br from-[#1A3C34]/5 to-[#1A3C34]/10 border-2 border-[#1A3C34]/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-[#1A3C34]" />
              <h2 className="font-sans text-sm text-[#1A3C34] font-medium">
                전화번호 인증
              </h2>
            </div>
            
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
                전화번호
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={isPhoneVerified}
                  className="flex-1 px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="010-0000-0000"
                  maxLength={13}
                />
                <button
                  onClick={handleSendCode}
                  disabled={isPhoneVerified || phoneNumber.replace(/[^\d]/g, '').length !== 11}
                  className="px-4 py-2.5 bg-[#1A3C34] text-white hover:bg-[#1A3C34]/90 rounded-lg transition-all duration-300 font-sans text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isCodeSent ? "재발송" : "인증번호"}
                </button>
              </div>
              {isPhoneVerified && (
                <p className="text-xs text-[#D4AF37] mt-1.5 font-sans flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  인증 완료
                </p>
              )}
            </div>

            {/* Verification Code Input */}
            {isCodeSent && !isPhoneVerified && (
              <div className="animate-fadeIn">
                <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
                  인증번호
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                      className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                      placeholder="6자리 숫자"
                      maxLength={6}
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
                    className="px-4 py-2.5 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-lg transition-all duration-300 flex items-center gap-1.5 font-sans text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              닉네임
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setIsNicknameChecked(false);
                }}
                className="flex-1 px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="닉네임을 입력하세요"
              />
              <button
                onClick={handleCheckNickname}
                className="px-4 py-2.5 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white rounded-lg transition-all duration-300 flex items-center gap-1.5 font-sans text-sm"
              >
                <Check className="w-4 h-4" />
                확인
              </button>
            </div>
            {isNicknameChecked && (
              <p className="text-xs text-[#D4AF37] mt-1.5 font-sans">
                ✓ 사용 가능
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              성별
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender("male")}
                className={`flex-1 py-2.5 rounded-lg font-sans text-sm transition-all duration-300 ${
                  gender === "male"
                    ? "bg-[#1A3C34] text-white"
                    : "border border-[#1A3C34]/20 text-[#1A3C34]/60 hover:border-[#1A3C34]/40"
                }`}
              >
                남성
              </button>
              <button
                onClick={() => setGender("female")}
                className={`flex-1 py-2.5 rounded-lg font-sans text-sm transition-all duration-300 ${
                  gender === "female"
                    ? "bg-[#1A3C34] text-white"
                    : "border border-[#1A3C34]/20 text-[#1A3C34]/60 hover:border-[#1A3C34]/40"
                }`}
              >
                여성
              </button>
            </div>
            <p className="text-xs text-[#D4AF37] mt-1.5 font-sans flex items-center gap-1">
              <Lock className="w-3 h-3" />
              한번 설정하면 수정이 불가능합니다
            </p>
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              생년월일
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
            <p className="text-xs text-[#D4AF37] mt-1.5 font-sans flex items-center gap-1">
              <Lock className="w-3 h-3" />
              한번 설정하면 수정이 불가능합니다
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              지역
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="">지역을 선택하세요</option>
              <option value="seoul">서울</option>
              <option value="busan">부산</option>
              <option value="incheon">인천</option>
              <option value="daegu">대구</option>
              <option value="daejeon">대전</option>
              <option value="gwangju">광주</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* Religion */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              종교
            </label>
            <select
              value={religion}
              onChange={(e) => setReligion(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="">종교를 선택하세요</option>
              <option value="none">무교</option>
              <option value="christianity">기독교</option>
              <option value="catholicism">천주교</option>
              <option value="buddhism">불교</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              키
            </label>
            <input
              type="text"
              value={height}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                setHeight(value);
              }}
              className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="키를 입력하세요 (cm)"
              maxLength={3}
            />
          </div>

          {/* Smoking */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              흡연 여부
            </label>
            <select
              value={smoking}
              onChange={(e) => setSmoking(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="">흡연 여부를 선택하세요</option>
              <option value="non-smoker">비흡연</option>
              <option value="smoker">흡연</option>
              <option value="quitting">금연중</option>
            </select>
          </div>

          {/* Drinking */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              음주 여부
            </label>
            <select
              value={drinking}
              onChange={(e) => setDrinking(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="">음주 여부를 선택하세요</option>
              <option value="non-drinker">비음주</option>
              <option value="social">사회적음주</option>
              <option value="less-than-4">월 4회미만</option>
              <option value="more-than-5">월 5회이상</option>
            </select>
          </div>

          {/* KakaoTalk ID */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#1A3C34]/40" />
              카카오톡 ID
            </label>
            <input
              type="text"
              value={kakaoId}
              onChange={(e) => setKakaoId(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="카카오톡 ID를 입력하세요"
            />
            <p className="text-xs text-[#1A3C34]/40 mt-1.5 font-sans">
              매칭에 성공한 상대방에게 공유될 연락처입니다
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              자기소개
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors resize-none bg-white leading-relaxed"
              placeholder="당신을 소개해주세요..."
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
              프로필 사진 (최소 1장)
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative flex-shrink-0">
                  {photo.url ? (
                    <>
                      <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-[#1A3C34]/10">
                        <ImageWithFallback
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-[#1A3C34] rounded-full flex items-center justify-center hover:bg-[#1A3C34]/80 transition-colors shadow-md z-10"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAddPhoto(photo.id)}
                      className="w-20 h-20 border-2 border-dashed border-[#1A3C34]/20 rounded-lg flex flex-col items-center justify-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-[#1A3C34]/30" />
                      <span className="text-[10px] text-[#1A3C34]/40 font-sans mt-0.5">
                        {index + 1}
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              <p className="text-xs text-[#1A3C34]/40 font-sans">
                AI 부적절한 사진 검사 활성화
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="sticky bottom-0 z-50 bg-[#FCFCFA] border-t border-[#1A3C34]/10 px-6 py-4">
        <button
          onClick={handleNext}
          className="w-full bg-[#D4AF37] text-white font-sans font-medium py-3.5 rounded-lg hover:bg-[#D4AF37]/90 transition-all duration-300 shadow-lg shadow-[#D4AF37]/20"
        >
          다음 단계
        </button>
      </div>
    </div>
  );
}
