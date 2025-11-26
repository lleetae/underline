import React, { useState } from "react";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { SignUpHeader } from "./SignUpHeader";

export interface Step2Data {
    nickname: string;
    gender: "male" | "female" | null;
    birthDate: string;
    location: string;
    height: number;
}

export function SignUpStep2Basics({
    onNext,
    onBack,
    initialData
}: {
    onNext: (data: Step2Data) => void;
    onBack: () => void;
    initialData?: Partial<Step2Data>;
}) {
    const [nickname, setNickname] = useState(initialData?.nickname || "");
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [gender, setGender] = useState<"male" | "female" | null>(initialData?.gender || null);
    const [birthDate, setBirthDate] = useState(initialData?.birthDate || "");
    const [location, setLocation] = useState(initialData?.location || "");
    const [height, setHeight] = useState<string>(initialData?.height?.toString() || "");

    const handleCheckNickname = () => {
        if (nickname.trim()) {
            setIsNicknameChecked(true);
            toast.success("사용 가능한 닉네임입니다");
        } else {
            toast.error("닉네임을 입력해주세요");
        }
    };

    const handleNext = () => {
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

        // Validate Age (Must be born on or before 2006-12-31)
        const birthYear = parseInt(birthDate.split("-")[0]);
        if (birthYear > 2006) {
            toast.error("2006년 이전 출생자만 가입 가능합니다");
            return;
        }

        if (!location) {
            toast.error("지역을 선택해주세요");
            return;
        }
        if (!height) {
            toast.error("키를 입력해주세요");
            return;
        }

        onNext({
            nickname,
            gender,
            birthDate,
            location,
            height: parseInt(height)
        });
    };

    return (
        <div className="w-full max-w-md mx-auto relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
            <SignUpHeader
                currentStep={2}
                totalSteps={4}
                onBack={onBack}
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 space-y-6">

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
                                className={`flex-1 py-2.5 rounded-lg font-sans text-sm transition-all duration-300 ${gender === "male"
                                    ? "bg-[#1A3C34] text-white"
                                    : "border border-[#1A3C34]/20 text-[#1A3C34]/60 hover:border-[#1A3C34]/40"
                                    }`}
                            >
                                남성
                            </button>
                            <button
                                onClick={() => setGender("female")}
                                className={`flex-1 py-2.5 rounded-lg font-sans text-sm transition-all duration-300 ${gender === "female"
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

                    {/* BirthDate */}
                    <div>
                        <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
                            생년월일
                        </label>
                        <input
                            type="date"
                            value={birthDate}
                            max="2006-12-31"
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white"
                        />
                        <p className="text-sm text-red-500 mt-2 font-sans font-bold">
                            2006년 12월 31일 이전 출생자만 가입 가능합니다
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

                    {/* Height */}
                    <div>
                        <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
                            키
                        </label>
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => {
                                const value = e.target.value.slice(0, 3);
                                setHeight(value);
                            }}
                            className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                            placeholder="키를 입력하세요 (cm)"
                            maxLength={3}
                        />
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
        </div >
    );
}
