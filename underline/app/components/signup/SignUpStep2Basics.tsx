import React, { useState } from "react";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { SignUpHeader } from "./SignUpHeader";
import { koreaDistrict } from "../../data/koreaDistrict";

export interface Step2Data {
    nickname: string;
    gender: "male" | "female" | null;
    birthDate: string;
    location: string;
    sido?: string;
    sigungu?: string;
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

    // Initialize city and district from location string "City District"
    const initialLocation = initialData?.location || "";
    const [initialCity, ...initialDistrictParts] = initialLocation.split(" ");
    const initialDistrict = initialDistrictParts.join(" ");

    const [city, setCity] = useState(initialCity || "");
    const [district, setDistrict] = useState(initialDistrict || "");

    const [height, setHeight] = useState<string>(initialData?.height?.toString() || "");
    const [isCheckingNickname, setIsCheckingNickname] = useState(false);

    const handleCheckNickname = async () => {
        if (!nickname.trim()) {
            toast.error("닉네임을 입력해주세요");
            return;
        }

        setIsCheckingNickname(true);
        try {
            const response = await fetch(`/api/check-nickname?nickname=${encodeURIComponent(nickname)}`);
            const data = await response.json();

            if (response.ok && data.available) {
                setIsNicknameChecked(true);
                toast.success(data.message);
            } else {
                setIsNicknameChecked(false);
                toast.error(data.message || "이미 사용 중인 닉네임입니다");
            }
        } catch (error) {
            console.error("Nickname check failed:", error);
            toast.error("중복 확인 중 오류가 발생했습니다");
            setIsNicknameChecked(false);
        } finally {
            setIsCheckingNickname(false);
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

        if (!city || !district) {
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
            location: `${city} ${district}`,
            sido: city,
            sigungu: district,
            height: parseInt(height)
        });
    };

    const isValid = nickname && isNicknameChecked && gender && birthDate && city && district && height;

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
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
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
                                className="flex-1 px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                                placeholder="닉네임을 입력하세요 (최대 7자)"
                                maxLength={7}
                            />
                            <button
                                type="button"
                                onClick={handleCheckNickname}
                                disabled={isCheckingNickname}
                                className="px-4 py-2.5 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-lg transition-all duration-300 flex items-center gap-1.5 font-sans text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCheckingNickname ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                확인
                            </button>
                        </div>
                        {isNicknameChecked && (
                            <p className="text-xs text-[var(--primary)] mt-1.5 font-sans">
                                ✓ 사용 가능
                            </p>
                        )}
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            성별
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setGender("male")}
                                className={`flex-1 py-2.5 rounded-lg font-sans text-sm transition-all duration-300 ${gender === "male"
                                    ? "bg-[var(--foreground)] text-white"
                                    : "border border-[var(--foreground)]/20 text-[var(--foreground)]/60 hover:border-[var(--foreground)]/40"
                                    }`}
                            >
                                남성
                            </button>
                            <button
                                onClick={() => setGender("female")}
                                className={`flex-1 py-2.5 rounded-lg font-sans text-sm transition-all duration-300 ${gender === "female"
                                    ? "bg-[var(--foreground)] text-white"
                                    : "border border-[var(--foreground)]/20 text-[var(--foreground)]/60 hover:border-[var(--foreground)]/40"
                                    }`}
                            >
                                여성
                            </button>
                        </div>
                        <p className="text-xs text-[var(--primary)] mt-1.5 font-sans flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            한번 설정하면 수정이 불가능합니다
                        </p>
                    </div>

                    {/* BirthDate */}
                    <div>
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            생년월일
                        </label>
                        <input
                            type="date"
                            value={birthDate}
                            max="2006-12-31"
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors bg-white"
                        />
                        <p className="text-sm text-red-500 mt-2 font-sans font-bold">
                            2006년 12월 31일 이전 출생자만 가입 가능합니다
                        </p>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            지역
                        </label>
                        <div className="flex gap-2">
                            {/* City Selector */}
                            <div className="flex-1">
                                <select
                                    value={city}
                                    onChange={(e) => {
                                        const newCity = e.target.value;
                                        setCity(newCity);

                                        // Auto-select if only one district exists (e.g. Sejong)
                                        const districts = koreaDistrict[newCity] || [];
                                        if (districts.length === 1) {
                                            setDistrict(districts[0]);
                                        } else {
                                            setDistrict("");
                                        }
                                    }}
                                    className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors bg-white appearance-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "right 12px center",
                                    }}
                                >
                                    <option value="">시/도 선택</option>
                                    {Object.keys(koreaDistrict).map((cityKey) => (
                                        <option key={cityKey} value={cityKey}>
                                            {cityKey}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* District Selector */}
                            <div className="flex-1">
                                <select
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                    disabled={!city}
                                    className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors bg-white appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "right 12px center",
                                    }}
                                >
                                    <option value="">시/군/구 선택</option>
                                    {city && koreaDistrict[city]?.map((districtName) => (
                                        <option key={districtName} value={districtName}>
                                            {districtName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Height */}
                    <div>
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            키
                        </label>
                        <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={height}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
                                setHeight(value);
                            }}
                            className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                            placeholder="키를 입력하세요 (cm)"
                            maxLength={3}
                        />
                    </div>

                </div>
            </div>

            {/* Bottom Action */}
            <div className="sticky bottom-0 z-50 bg-[#FCFCFA] border-t border-[var(--foreground)]/10 px-6 py-4">
                <button
                    onClick={handleNext}
                    disabled={!isValid}
                    className={`w-full font-sans font-medium py-3.5 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2
                        ${!isValid
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-[var(--primary)]/20"
                        }`}
                >
                    다음 단계
                </button>
            </div>
        </div >
    );
}
