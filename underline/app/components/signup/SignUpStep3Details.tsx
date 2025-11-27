import React, { useState } from "react";
import { toast } from "sonner";
import { SignUpHeader } from "./SignUpHeader";

export interface Step3Data {
    religion: string;
    smoking: string;
    drinking: string;
    bio: string;
}

export function SignUpStep3Details({
    onNext,
    onBack,
    initialData
}: {
    onNext: (data: Step3Data) => void;
    onBack: () => void;
    initialData?: Partial<Step3Data>;
}) {
    const [religion, setReligion] = useState(initialData?.religion || "");
    const [smoking, setSmoking] = useState(initialData?.smoking || "");
    const [drinking, setDrinking] = useState(initialData?.drinking || "");
    const [bio, setBio] = useState(initialData?.bio || "");

    const handleNext = () => {
        if (!religion) {
            toast.error("종교를 선택해주세요");
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

        onNext({
            religion,
            smoking,
            drinking,
            bio
        });
    };

    return (
        <div className="w-full max-w-md mx-auto relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
            <SignUpHeader
                currentStep={3}
                totalSteps={4}
                onBack={onBack}
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 space-y-6">

                    {/* Religion */}
                    <div>
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            종교
                        </label>
                        <select
                            value={religion}
                            onChange={(e) => setReligion(e.target.value)}
                            className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors bg-white appearance-none"
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

                    {/* Smoking */}
                    <div>
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            흡연 여부
                        </label>
                        <select
                            value={smoking}
                            onChange={(e) => setSmoking(e.target.value)}
                            className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors bg-white appearance-none"
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
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            음주 여부
                        </label>
                        <select
                            value={drinking}
                            onChange={(e) => setDrinking(e.target.value)}
                            className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors bg-white appearance-none"
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

                    {/* Bio */}
                    <div>
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            자기소개
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none bg-white leading-relaxed"
                            placeholder="당신을 소개해주세요..."
                        />
                    </div>

                </div>
            </div>

            {/* Bottom Action */}
            <div className="sticky bottom-0 z-50 bg-[#FCFCFA] border-t border-[var(--foreground)]/10 px-6 py-4">
                <button
                    onClick={handleNext}
                    className="w-full bg-[var(--primary)] text-white font-sans font-medium py-3.5 rounded-lg hover:bg-[var(--primary)]/90 transition-all duration-300 shadow-lg shadow-[var(--primary)]/20"
                >
                    다음 단계
                </button>
            </div>
        </div>
    );
}
