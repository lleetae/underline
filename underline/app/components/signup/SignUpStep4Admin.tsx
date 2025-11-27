import React, { useState } from "react";
import { Check, Lock, Plus, Shield, X } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";
import { SignUpHeader } from "./SignUpHeader";

interface PhotoSlot {
    id: string;
    url: string | null;
    originalPath?: string | null;
    blurredUrl?: string | null;
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
        { id: "1", url: null },
        { id: "2", url: null },
        { id: "3", url: null },
        { id: "4", url: null },
        { id: "5", url: null },
    ]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

    const handleAddPhoto = (id: string) => {
        const uploadedCount = photos.filter(p => p.url !== null).length;
        if (uploadedCount >= 5) {
            toast.error("최대 5장까지 등록할 수 있습니다");
            return;
        }
        setActiveSlotId(id);
        fileInputRef.current?.click();
    };

    const checkNudity = async (file: File): Promise<boolean> => {
        try {
            const nsfwjs = await import('nsfwjs');


            // Create an image element to load the file
            const img = document.createElement('img');
            const objectUrl = URL.createObjectURL(file);

            return new Promise((resolve) => {
                img.onload = async () => {
                    try {
                        const model = await nsfwjs.load();
                        const predictions = await model.classify(img);

                        // Check for Porn or Hentai with high probability
                        const isNsfw = predictions.some(p =>
                            (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.6
                        );

                        URL.revokeObjectURL(objectUrl);
                        resolve(isNsfw);
                    } catch (error) {
                        console.error("NSFW check error:", error);
                        URL.revokeObjectURL(objectUrl);
                        resolve(false); // Fail safe
                    }
                };
                img.src = objectUrl;
            });
        } catch (error) {
            console.error("Failed to load NSFW model:", error);
            return false;
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeSlotId) return;

        // Reset input
        e.target.value = '';

        const loadingToast = toast.loading("사진을 검사하고 있습니다...");

        try {
            // 1. Check Nudity
            const isNsfw = await checkNudity(file);

            if (isNsfw) {
                toast.dismiss(loadingToast);
                toast.error("부적절한 이미지가 감지되었습니다");
                return;
            }

            toast.dismiss(loadingToast);
            const uploadToast = toast.loading("사진을 업로드하고 블러 처리중입니다...");

            // 2. Upload via API (Server-side processing)
            const { supabase } = await import('../../lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.dismiss(uploadToast);
                toast.error("로그인이 필요합니다. 다시 로그인해주세요.");
                return;
            }

            const formData = new FormData();
            formData.append('photo', file);
            formData.append('userId', session.user.id);

            const response = await fetch('/api/upload/photo', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            // 3. Update State
            setPhotos(photos.map(photo =>
                photo.id === activeSlotId ? {
                    ...photo,
                    url: result.blurredUrl, // Display blurred image
                    originalPath: result.originalPath,
                    blurredUrl: result.blurredUrl
                } : photo
            ));

            toast.dismiss(uploadToast);
            toast.success("사진이 등록되었습니다");

        } catch (error: any) {
            console.error("Upload failed:", error);
            toast.dismiss(loadingToast);
            toast.error(`업로드 실패: ${error.message || "알 수 없는 오류"}`);
        } finally {
            setActiveSlotId(null);
        }
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
        <div className="w-full max-w-md mx-auto relative shadow-2xl shadow-black/5 min-h-screen bg-[#FAFAFA] flex flex-col">
            <SignUpHeader
                currentStep={4}
                totalSteps={4}
                onBack={onBack}
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 space-y-6">

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                    />

                    {/* KakaoTalk ID */}
                    <div>
                        <label className="block text-sm text-[#171717]/70 font-sans mb-2 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-[#171717]/40" />
                            카카오톡 ID
                        </label>
                        <input
                            type="text"
                            value={kakaoId}
                            onChange={(e) => setKakaoId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-[#171717]/20 rounded-lg text-[#171717] font-sans text-sm focus:outline-none focus:border-[#CC0000] transition-colors"
                            placeholder="카카오톡 ID를 입력하세요"
                        />
                        <p className="text-xs text-[#171717]/40 mt-1.5 font-sans">
                            매칭에 성공한 상대방에게 공유될 연락처입니다
                        </p>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-sm text-[#171717]/70 font-sans mb-2">
                            프로필 사진 (최소 1장)
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {photos.map((photo, index) => (
                                <div key={photo.id} className="relative flex-shrink-0">
                                    {photo.url ? (
                                        <>
                                            <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-[#171717]/10">
                                                <ImageWithFallback
                                                    src={photo.url}
                                                    alt={`Photo ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemovePhoto(photo.id)}
                                                className="absolute top-1 right-1 w-6 h-6 bg-[#171717] rounded-full flex items-center justify-center hover:bg-[#171717]/80 transition-colors shadow-md z-10"
                                            >
                                                <X className="w-3.5 h-3.5 text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleAddPhoto(photo.id)}
                                            className="w-20 h-20 border-2 border-dashed border-[#171717]/20 rounded-lg flex flex-col items-center justify-center hover:border-[#CC0000] hover:bg-[#CC0000]/5 transition-colors"
                                        >
                                            <Plus className="w-5 h-5 text-[#171717]/30" />
                                            <span className="text-[10px] text-[#171717]/40 font-sans mt-0.5">
                                                {index + 1}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            <Shield className="w-3.5 h-3.5 text-[#CC0000]" />
                            <p className="text-xs text-[#171717]/40 font-sans">
                                AI 부적절한 사진 검사 활성화
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Action */}
            <div className="sticky bottom-0 z-50 bg-[#FAFAFA] border-t border-[#171717]/10 px-6 py-4">
                <button
                    onClick={handleComplete}
                    className="w-full bg-[#CC0000] text-white font-sans font-medium py-3.5 rounded-lg hover:bg-[#CC0000]/90 transition-all duration-300 shadow-lg shadow-[#CC0000]/20 flex items-center justify-center gap-2"
                >
                    <Check className="w-5 h-5" />
                    가입 완료하기
                </button>
            </div>
        </div>
    );
}
