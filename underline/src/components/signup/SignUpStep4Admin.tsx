import React, { useState } from "react";
import { Check, Lock, Plus, Shield, X } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner@2.0.3";
import { SignUpHeader } from "./SignUpHeader";

interface PhotoSlot {
    id: string;
    url: string | null;
}

export interface Step4Data {
    kakaoId: string;
    photos: PhotoSlot[];
}

export function SignUpStep4Admin({
    onComplete,
    onBack,
    initialData
}: {
    onComplete: (data: Step4Data) => void;
    onBack: () => void;
    initialData?: Partial<Step4Data>;
}) {
    const [kakaoId, setKakaoId] = useState(initialData?.kakaoId || "");
    const [photos, setPhotos] = useState<PhotoSlot[]>(initialData?.photos || [
        { id: "1", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330" },
        { id: "2", url: null },
        { id: "3", url: null },
        { id: "4", url: null },
        { id: "5", url: null },
    ]);

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

    const handleComplete = () => {
        if (!kakaoId) {
            toast.error("카카오톡 ID를 입력해주세요");
            return;
        }
        const uploadedCount = photos.filter(p => p.url !== null).length;
        if (uploadedCount < 1) {
            toast.error("프로필 사진을 최소 1장 이상 등록해주세요");
            return;
        }

        onComplete({
            kakaoId,
            photos
        });
    };

    return (
        <div className="w-full max-w-md mx-auto relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
            <SignUpHeader
                currentStep={4}
                totalSteps={4}
                onBack={onBack}
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 space-y-6">

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
                    onClick={handleComplete}
                    className="w-full bg-[#D4AF37] text-white font-sans font-medium py-3.5 rounded-lg hover:bg-[#D4AF37]/90 transition-all duration-300 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
                >
                    <Check className="w-5 h-5" />
                    가입 완료하기
                </button>
            </div>
        </div>
    );
}
