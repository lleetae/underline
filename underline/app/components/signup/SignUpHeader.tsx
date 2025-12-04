import React from "react";
import { ArrowLeft } from "lucide-react";

interface SignUpHeaderProps {
    currentStep: number;
    totalSteps: number;
    onBack?: () => void;
    title?: string;
}

export function SignUpHeader({
    currentStep,
    totalSteps,
    onBack,
    title = "회원가입"
}: SignUpHeaderProps) {


    return (
        <div className="sticky top-0 z-50 bg-[#FCFCFA] border-b border-[var(--foreground)]/10">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                    <button
                        className="p-1 hover:bg-[var(--foreground)]/5 rounded-full transition-colors"
                        onClick={onBack}
                    >
                        <ArrowLeft className="w-6 h-6 text-[var(--foreground)]" />
                    </button>
                    <h1 className="font-sans text-xl text-[var(--foreground)] pt-0.5">{title}</h1>
                </div>
            </div>
            {/* Progress Bar */}
            {/* Segmented Progress Bar */}
            <div className="w-full px-6 pb-4">
                <div className="flex gap-2">
                    {Array.from({ length: totalSteps }).map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${index < currentStep
                                ? "bg-[var(--foreground)]"
                                : "bg-gray-200"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
