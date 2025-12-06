import React, { useState } from "react";
import { Check, Lock, Plus, Shield, X } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";
import { SignUpHeader } from "./SignUpHeader";
import { Badge } from "../ui/badge";

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

        const loadingToast = toast.loading("사진을 최적화하고 검사하고 있습니다...");

        try {
            // 0. Compress Image
            const imageCompression = (await import('browser-image-compression')).default;

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            };

            const compressedFile = await imageCompression(file, options);
            console.log(`Original size: ${file.size / 1024 / 1024} MB`);
            console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`);

            // 1. Check Nudity (Use compressed file for faster check)
            const isNsfw = await checkNudity(compressedFile);

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
            formData.append('photo', compressedFile); // Upload compressed file
            formData.append('userId', session.user.id);

            const response = await fetch('/api/upload/photo', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
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

    const uploadedCount = photos.filter(p => p.url !== null).length;
    const isValid = kakaoId && uploadedCount >= 1;

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
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            카카오톡 ID
                        </label>
                        <input
                            type="text"
                            value={kakaoId}
                            onChange={(e) => setKakaoId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                            placeholder="카카오톡 ID를 입력하세요"
                        />
                        <div className="mt-2 flex items-start gap-2 bg-blue-50/80 border border-blue-200/50 rounded-lg py-2 px-3">
                            <Lock className="w-3.5 h-3.5 text-blue-600 mt-0.5" />
                            <p className="text-xs text-blue-700 font-sans leading-relaxed">
                                매칭 후 연락처 잠금 해제 전까지 절대 공개되지 않으니 안심하세요.
                            </p>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            프로필 사진 (최소 1장)
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {photos.map((photo, index) => (
                                <div key={photo.id} className="relative flex-shrink-0">
                                    {photo.url ? (
                                        <>
                                            <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-[var(--foreground)]/10">
                                                <ImageWithFallback
                                                    src={photo.url}
                                                    alt={`Photo ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleRemovePhoto(photo.id)}
                                                className="absolute top-1 right-1 w-6 h-6 bg-[var(--foreground)] rounded-full flex items-center justify-center hover:bg-[var(--foreground)]/80 transition-colors shadow-md z-10"
                                            >
                                                <X className="w-3.5 h-3.5 text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleAddPhoto(photo.id)}
                                            className="w-20 h-20 border-2 border-dashed border-[var(--foreground)]/20 rounded-lg flex flex-col items-center justify-center hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
                                        >
                                            <Plus className="w-5 h-5 text-[var(--foreground)]/30" />
                                            <span className="text-[10px] text-[var(--foreground)]/40 font-sans mt-0.5">
                                                {index + 1}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Badge variant="outline" className="mt-2 py-2 px-3 rounded-lg font-normal bg-blue-50/80 text-blue-700 border-blue-200/50 block text-start">
                            <div className="flex items-start gap-2">
                                <Shield className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                                <span className="leading-relaxed">
                                    매칭 성사 전까지 사진은 블러 처리되어 공개되지 않습니다.
                                </span>
                            </div>
                        </Badge>
                    </div>

                </div>
            </div>

            {/* Bottom Action */}
            <div className="sticky bottom-0 z-50 bg-[#FCFCFA] border-t border-[var(--foreground)]/10 px-6 py-4">
                <button
                    onClick={handleComplete}
                    disabled={!isValid}
                    className={`w-full font-sans font-medium py-3.5 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2
                        ${!isValid
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-[var(--primary)]/20"
                        }`}
                >
                    <Check className="w-5 h-5" />
                    가입 완료하기
                </button>
            </div>
        </div>
    );
}
