
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Check, Plus, Save, Shield, X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { koreaDistrict } from "../data/koreaDistrict";

interface Photo {
  id: string;
  url: string;
  originalPath?: string;
  blurredUrl?: string;
  file?: File;
}

export interface ProfileData {
  nickname: string;
  gender: string;
  birthDate: string;
  location: string;
  religion: string;
  height: string;
  smoking: string;
  drinking: string;
  bio: string;
  kakaoId: string;
  profilePhotos: Photo[];
}

interface ProfileEditViewProps {
  profileData: ProfileData;
  onBack: () => void;
  onSave: (updatedData: ProfileData, deletedPhotos: Photo[]) => Promise<void>;
}

export function ProfileEditView({ profileData, onBack, onSave }: ProfileEditViewProps) {
  const [formData, setFormData] = useState<ProfileData>(profileData);
  const [deletedPhotos, setDeletedPhotos] = useState<Photo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(true);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize city and district from location string "City District"
  const initialLocation = profileData.location || "";
  const [initialCity, ...initialDistrictParts] = initialLocation.split(" ");
  const initialDistrict = initialDistrictParts.join(" ");

  const [city, setCity] = useState(initialCity || "");
  const [district, setDistrict] = useState(initialDistrict || "");

  // Update formData.location whenever city or district changes
  useEffect(() => {
    if (city && district) {
      setFormData(prev => ({ ...prev, location: `${city} ${district} ` }));
    } else if (city && !district) {
      // If district is not selected yet (and not auto-selected), we might want to clear location or keep partial?
      // But the validation checks for location presence.
      // Let's keep it as is, validation will fail if empty.
      // Actually, let's update it to just city if district is empty (though invalid for our logic)
      // or just wait until both are present.
      // Better to update it so isDirty detection works.
      setFormData(prev => ({ ...prev, location: `${city} ` }));
    }
  }, [city, district]);

  // Fetch signed URLs for original photos on mount
  useEffect(() => {
    const fetchSignedUrls = async () => {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const updatedPhotos = await Promise.all(profileData.profilePhotos.map(async (photo) => {
        if (photo.originalPath && !photo.file) {
          try {
            // Use API to bypass RLS for private bucket access
            const response = await fetch('/api/photo/signed-url', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token} `
              },
              body: JSON.stringify({ path: photo.originalPath })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.signedUrl) {
                return { ...photo, url: data.signedUrl };
              }
            }
          } catch (e) {
            console.error("Error fetching signed URL:", e);
          }
        }
        return photo;
      }));

      // Only update if there are changes to avoid infinite loop if we were depending on formData
      // But here we are updating formData based on initial profileData.
      // We should probably only do this once.
      setFormData(prev => ({
        ...prev,
        profilePhotos: updatedPhotos
      }));
    };

    fetchSignedUrls();
  }, [profileData.profilePhotos]); // Depend on initial profileData photos

  // Sync Kakao ID from props (for background decryption updates) and verify decryption
  useEffect(() => {
    // 1. Sync from props if different
    if (profileData.kakaoId !== formData.kakaoId) {
      setFormData(prev => ({
        ...prev,
        kakaoId: profileData.kakaoId
      }));
    }

    // 2. Safeguard: If the ID looks encrypted (long string starting with 'ww'), decrypt it.
    const checkAndDecrypt = async () => {
      const currentId = profileData.kakaoId || formData.kakaoId;
      if (currentId && currentId.length > 20 && !currentId.includes(' ')) {
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (!token) return;

          const response = await fetch('/api/decrypt/kakao', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ encryptedId: currentId })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.decryptedId && data.decryptedId !== currentId) {
              setFormData(prev => ({ ...prev, kakaoId: data.decryptedId }));
            }
          }
        } catch (e) {
          console.error("Safeguard decryption failed:", e);
        }
      }
    };

    checkAndDecrypt();

  }, [profileData.kakaoId, formData.kakaoId]); // Add formData.kakaoId to dependency to re-check if user clears it? No, just loop risk.
  // Actually, depend on profileData.kakaoId primarily.
  // If we mistakenly depend on formData.kakaoId and update it, we might loop.
  // Safe dep: [profileData.kakaoId] is safe. 
  // But we also want to catch the initial state where formData is set from profileData.
  // Let's keep it simple: Just run on mount and when profileData changes.
  // The existing dependency [profileData.kakaoId] is correct for the first part.
  // We can add a separate useEffect for the safeguard to run once on mount?
  // Or just combine here cautiously.

  // Check for changes
  useEffect(() => {
    const checkDirty = () => {
      // 1. Check photos
      const hasDeletedPhotos = deletedPhotos.length > 0;
      const hasNewPhotos = formData.profilePhotos.some(p => p.file);
      // Also check if photo count changed (though deletedPhotos covers this usually, 
      // but if we just removed one and added one, count might be same but content diff)
      // Actually, if we delete, it goes to deletedPhotos and removed from formData.
      // If we add, it has 'file'.
      // So checking deletedPhotos > 0 OR hasNewPhotos is sufficient for photo changes.

      // Compare current photos with initial profileData photos (excluding new local files)
      // A more robust photo comparison:
      // Check if any photo was added (has .file)
      // Check if any photo was removed (present in deletedPhotos)
      // Check if the order of existing photos changed (if that's a concern, not currently supported by UI)
      // For now, `hasDeletedPhotos` and `hasNewPhotos` are good indicators.
      // We also need to check if the *set* of non-new photos is different.
      const initialExistingPhotoIds = new Set(profileData.profilePhotos.filter(p => !p.file).map(p => p.id));
      const currentExistingPhotoIds = new Set(formData.profilePhotos.filter(p => !p.file).map(p => p.id));

      const existingPhotosChanged = initialExistingPhotoIds.size !== currentExistingPhotoIds.size ||
        ![...initialExistingPhotoIds].every(id => currentExistingPhotoIds.has(id));


      if (hasDeletedPhotos || hasNewPhotos || existingPhotosChanged) {
        setIsDirty(true);
        return;
      }

      // 2. Check text fields
      const isNicknameChanged = formData.nickname !== profileData.nickname;
      const isBioChanged = formData.bio !== profileData.bio;
      const isKakaoIdChanged = formData.kakaoId !== profileData.kakaoId;
      const isLocationChanged = formData.location !== profileData.location;
      const isReligionChanged = formData.religion !== profileData.religion;
      const isHeightChanged = formData.height !== profileData.height;
      const isSmokingChanged = formData.smoking !== profileData.smoking;
      const isDrinkingChanged = formData.drinking !== profileData.drinking;

      if (
        isNicknameChanged ||
        isBioChanged ||
        isKakaoIdChanged ||
        isLocationChanged ||
        isReligionChanged ||
        isHeightChanged ||
        isSmokingChanged ||
        isDrinkingChanged
      ) {
        setIsDirty(true);
      } else {
        setIsDirty(false);
      }
    };

    checkDirty();
  }, [formData, deletedPhotos, profileData]);

  const handleCheckNickname = async () => {
    if (!formData.nickname.trim()) {
      toast.error("닉네임을 입력해주세요");
      return;
    }

    setIsCheckingNickname(true);
    try {
      const response = await fetch(`/api/check-nickname?nickname=${encodeURIComponent(formData.nickname)}`);
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

  const handleSave = async () => {
    if (!isDirty) return; // Prevent saving if no changes

    if (formData.profilePhotos.length === 0) {
      toast.error("프로필 사진을 최소 1개 이상 등록해주세요");
      return;
    }
    if (!formData.nickname.trim()) {
      toast.error("닉네임을 입력해주세요");
      return;
    }
    if (!isNicknameChecked) {
      toast.error("닉네임 중복 확인을 해주세요");
      return;
    }
    if (!formData.height || parseInt(formData.height) < 100 || parseInt(formData.height) > 250) {
      toast.error("올바른 키를 입력해주세요 (100-250cm)");
      return;
    }
    if (!formData.bio.trim()) {
      toast.error("자기소개를 입력해주세요");
      return;
    }
    if (!formData.kakaoId.trim()) {
      toast.error("카카오톡 ID를 입력해주세요");
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("프로필을 저장하고 있습니다...");

    try {
      // 1. Upload new photos
      const updatedPhotos = await Promise.all(formData.profilePhotos.map(async (photo) => {
        if (photo.file) {
          // Upload this new photo
          const uploadFormData = new FormData();
          uploadFormData.append('photo', photo.file);

          // We need userId for the upload API. 
          // Since we are in a component, we might not have it directly if not passed.
          // However, the API expects it. We can get it from supabase client or pass it as prop.
          // For now, let's try to get it from the session in the API call context or assume the API handles it?
          // Actually the API requires 'userId' in body.
          // We can fetch session here to get userId.
          const { supabase } = await import('../lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();

          if (!session) throw new Error("로그인이 필요합니다");

          uploadFormData.append('userId', session.user.id);

          const response = await fetch('/api/upload/photo', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            },
            body: uploadFormData
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
          }

          return {
            id: photo.id,
            url: result.blurredUrl,
            originalPath: result.originalPath,
            blurredUrl: result.blurredUrl
            // file property is removed
          };
        }
        return photo;
      }));

      // 2. Call onSave with updated photo data
      const finalFormData = {
        ...formData,
        profilePhotos: updatedPhotos
      };

      await onSave(finalFormData, deletedPhotos);

      toast.dismiss(loadingToast);
      // Success toast is handled by parent or we can do it here
      // toast.success("프로필이 저장되었습니다"); 
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.dismiss(loadingToast);
      toast.error(`저장 실패: ${error.message || "알 수 없는 오류"} `);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPhoto = () => {
    if (formData.profilePhotos.length >= 5) {
      toast.error("프로필 사진은 최대 5개까지 등록할 수 있습니다");
      return;
    }
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
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    // Reset input
    e.target.value = '';

    const loadingToast = toast.loading("사진을 압축하고 검사하고 있습니다...");

    try {
      // 0. Compress Image
      const imageCompression = (await import('browser-image-compression')).default;

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg'
      };

      const file = await imageCompression(originalFile, options);
      console.log(`Original: ${originalFile.size / 1024 / 1024}MB, Compressed: ${file.size / 1024 / 1024}MB`);
      // 1. Check Nudity
      const isNsfw = await checkNudity(file);

      if (isNsfw) {
        toast.dismiss(loadingToast);
        toast.error("부적절한 이미지가 감지되었습니다");
        return;
      }

      toast.dismiss(loadingToast);

      // 2. Create Local Preview (Deferred Upload)
      const objectUrl = URL.createObjectURL(file);

      const newPhoto: Photo = {
        id: Date.now().toString(),
        url: objectUrl,
        file: file // Store file for later upload
      };

      setFormData(prev => ({
        ...prev,
        profilePhotos: [...prev.profilePhotos, newPhoto]
      }));

    } catch (error: any) {
      console.error("File selection failed:", error);
      toast.dismiss(loadingToast);
      toast.error("사진 선택 중 오류가 발생했습니다");
    }
  };

  const handleDeletePhoto = (id: string) => {
    if (formData.profilePhotos.length <= 1) {
      toast.error("프로필 사진은 최소 1개 이상 필요합니다");
      return;
    }

    const photoToDelete = formData.profilePhotos.find(p => p.id === id);

    if (photoToDelete) {
      // Only track for server deletion if it's NOT a new local file
      if (!photoToDelete.file) {
        setDeletedPhotos([...deletedPhotos, photoToDelete]);
      } else {
        // If it was a local file, revoke the object URL to free memory
        URL.revokeObjectURL(photoToDelete.url);
      }
    }

    setFormData({
      ...formData,
      profilePhotos: formData.profilePhotos.filter((photo) => photo.id !== id),
    });
    // toast.success("사진이 삭제되었습니다"); // Optional, maybe too noisy
  };

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#FCFCFA] border-b border-[var(--foreground)]/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              className="p-1 hover:bg-[var(--foreground)]/5 rounded-full transition-colors"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
            </button>
            <h1 className="font-sans text-2xl text-[var(--foreground)]">프로필 수정</h1>
          </div>
          {/* Save button removed from header */}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32"> {/* Increased padding bottom for floating button */}
        <div className="px-6 py-6 space-y-6">
          {/* Profile Photos Section */}
          <div className="bg-white border border-[var(--foreground)]/10 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-lg text-[var(--foreground)]">프로필 사진</h3>
              <span className="text-xs text-[var(--foreground)]/60 font-sans">
                {formData.profilePhotos.length} / 5
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            <div className="grid grid-cols-3 gap-3">
              {/* Existing Photos */}
              {formData.profilePhotos.map((photo, index) => (
                <div key={photo.id} className="relative aspect-square">
                  <div className="w-full h-full rounded-lg overflow-hidden border border-[var(--foreground)]/10">
                    <ImageWithFallback
                      src={photo.url}
                      alt={`Profile ${index + 1} `}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-[var(--primary)] text-white text-xs px-2 py-0.5 rounded font-sans">
                      대표
                    </div>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-[var(--foreground)] rounded-full flex items-center justify-center hover:bg-[var(--foreground)]/80 transition-colors shadow-md"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}

              {/* Add Photo Button */}
              {formData.profilePhotos.length < 5 && (
                <button
                  onClick={handleAddPhoto}
                  className="aspect-square border-2 border-dashed border-[var(--primary)] rounded-lg flex flex-col items-center justify-center gap-1.5 hover:bg-[var(--primary)]/5 transition-colors"
                >
                  <Plus className="w-6 h-6 text-[var(--primary)]" />
                  <span className="text-xs text-[var(--primary)] font-sans">추가</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-3">
              <Shield className="w-3.5 h-3.5 text-[var(--primary)]" />
              <p className="text-xs text-[var(--foreground)]/40 font-sans">
                AI 부적절한 사진 검사 활성화
              </p>
            </div>
            <p className="text-xs text-[var(--foreground)]/60 font-sans mt-1 leading-relaxed">
              <span className="text-[var(--primary)]">최소 1장</span> 이상, <span className="text-[var(--primary)]">최대 5장</span>까지 등록 가능합니다
            </p>
          </div>

          {/* Basic Information */}
          <div className="bg-white border border-[var(--foreground)]/10 rounded-xl p-5 shadow-sm">
            <h3 className="font-sans text-lg text-[var(--foreground)] mb-4">기본 정보</h3>
            <div className="space-y-4">
              {/* Nickname */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  닉네임 *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData({ ...formData, nickname: newValue });
                      if (newValue === profileData.nickname) {
                        setIsNicknameChecked(true);
                      } else {
                        setIsNicknameChecked(false);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                    placeholder="닉네임을 입력하세요 (최대 7자)"
                    maxLength={7}
                  />
                  <button
                    type="button"
                    onClick={handleCheckNickname}
                    disabled={isCheckingNickname || formData.nickname === profileData.nickname}
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
                {isNicknameChecked && formData.nickname !== profileData.nickname && (
                  <p className="text-xs text-[var(--primary)] mt-1.5 font-sans">
                    ✓ 사용 가능
                  </p>
                )}
              </div>

              {/* Gender - Read Only */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  성별
                </label>
                <input
                  type="text"
                  value={formData.gender === 'male' ? '남성' : formData.gender === 'female' ? '여성' : formData.gender}
                  disabled
                  className="w-full px-4 py-2.5 border border-[var(--foreground)]/10 rounded-lg text-[var(--foreground)]/40 font-sans text-sm bg-[var(--foreground)]/5 cursor-not-allowed"
                />
                <p className="text-xs text-[var(--foreground)]/40 mt-1 font-sans">
                  성별은 변경할 수 없습니다
                </p>
              </div>

              {/* Birth Date - Read Only */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  생년월일
                </label>
                <input
                  type="text"
                  value={formData.birthDate}
                  disabled
                  className="w-full px-4 py-2.5 border border-[var(--foreground)]/10 rounded-lg text-[var(--foreground)]/40 font-sans text-sm bg-[var(--foreground)]/5 cursor-not-allowed"
                />
                <p className="text-xs text-[var(--foreground)]/40 mt-1 font-sans">
                  생년월일은 변경할 수 없습니다
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white border border-[var(--foreground)]/10 rounded-xl p-5 shadow-sm">
            <h3 className="font-sans text-lg text-[var(--foreground)] mb-4">추가 정보</h3>
            <div className="space-y-4">
              {/* Location */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  지역 *
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

              {/* Religion */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  종교
                </label>
                <select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors bg-white appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="none">무교</option>
                  <option value="christianity">기독교</option>
                  <option value="catholicism">천주교</option>
                  <option value="buddhism">불교</option>
                  <option value="other">기타</option>
                </select>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  키 (cm) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.height}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
                    setFormData({ ...formData, height: value });
                  }}
                  className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder="키를 입력하세요"
                  maxLength={3}
                />
              </div>

              {/* Smoking */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  흡연 여부
                </label>
                <select
                  value={formData.smoking}
                  onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors bg-white appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="non-smoker">비흡연</option>
                  <option value="smoker">흡연</option>
                  <option value="quitting">금연중</option>
                </select>
              </div>

              {/* Drinking */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  음주 여부
                </label>
                <select
                  value={formData.drinking}
                  onChange={(e) => setFormData({ ...formData, drinking: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors bg-white appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="non-drinker">비음주</option>
                  <option value="social">사회적음주</option>
                  <option value="less-than-4">월 4회미만</option>
                  <option value="more-than-5">월 5회이상</option>
                </select>
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="bg-white border border-[var(--foreground)]/10 rounded-xl p-5 shadow-sm">
            <h3 className="font-sans text-lg text-[var(--foreground)] mb-4">자기소개</h3>
            <div className="space-y-4">
              {/* Bio */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  소개 *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={6}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none bg-white leading-relaxed"
                  placeholder="당신을 표현하는 문장을 작성해주세요..."
                />
                <p className="text-xs text-[var(--foreground)]/40 mt-1 font-sans text-right">
                  {formData.bio.length} / 500
                </p>
              </div>

              {/* Kakao ID */}
              <div>
                <label className="block text-xs text-[var(--foreground)]/70 font-sans mb-2">
                  카카오톡 ID *
                </label>
                <input
                  type="text"
                  value={formData.kakaoId}
                  onChange={(e) => setFormData({ ...formData, kakaoId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder="카카오톡 ID를 입력하세요"
                  maxLength={30}
                />
                <p className="text-xs text-[var(--foreground)]/40 mt-1 font-sans">
                  매칭 수락 후 연락처 잠금 해제 시에만 공개됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* Required Field Notice */}
          <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg p-4">
            <p className="text-xs text-[var(--foreground)]/70 font-sans leading-relaxed">
              <span className="text-[var(--primary)]">*</span> 표시는 필수 입력 항목입니다
            </p>
          </div>

        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-[70px] left-0 right-0 p-6 bg-gradient-to-t from-[#FCFCFA] via-[#FCFCFA] to-transparent z-50 flex justify-center">
        <div className="w-full max-w-md">
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty || !city || !district}
            className={`w-full font-sans font-medium py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isDirty && city && district
              ? "bg-[var(--foreground)] text-white shadow-[var(--foreground)]/20 hover:bg-[var(--foreground)]/90"
              : "bg-[var(--foreground)]/20 text-[var(--foreground)]/40 shadow-none cursor-not-allowed"
              }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                <Save className={`w-5 h-5 ${isDirty ? "" : "opacity-50"}`} />
                <span>변경사항 저장하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}