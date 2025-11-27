import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Plus, X, Shield, Save } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";

interface Photo {
  id: string;
  url: string;
  originalPath?: string;
  blurredUrl?: string;
  file?: File;
}

interface ProfileData {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                'Authorization': `Bearer ${token}`
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
      toast.error(`저장 실패: ${error.message || "알 수 없는 오류"}`);
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
    const file = e.target.files?.[0];
    if (!file) return;

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
      <div className="sticky top-0 z-50 bg-[#FCFCFA] border-b border-[#1A3C34]/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              className="p-1 hover:bg-[#1A3C34]/5 rounded-full transition-colors"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5 text-[#1A3C34]" />
            </button>
            <h1 className="font-serif text-2xl text-[#1A3C34]">프로필 수정</h1>
          </div>
          {/* Save button removed from header */}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32"> {/* Increased padding bottom for floating button */}
        <div className="px-6 py-6 space-y-6">
          {/* Profile Photos Section */}
          <div className="bg-white border border-[#1A3C34]/10 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-[#1A3C34]">프로필 사진</h3>
              <span className="text-xs text-[#1A3C34]/60 font-sans">
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
                  <div className="w-full h-full rounded-lg overflow-hidden border border-[#1A3C34]/10">
                    <ImageWithFallback
                      src={photo.url}
                      alt={`Profile ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-[#D4AF37] text-white text-xs px-2 py-0.5 rounded font-sans">
                      대표
                    </div>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-[#1A3C34] rounded-full flex items-center justify-center hover:bg-[#1A3C34]/80 transition-colors shadow-md"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}

              {/* Add Photo Button */}
              {formData.profilePhotos.length < 5 && (
                <button
                  onClick={handleAddPhoto}
                  className="aspect-square border-2 border-dashed border-[#D4AF37] rounded-lg flex flex-col items-center justify-center gap-1.5 hover:bg-[#D4AF37]/5 transition-colors"
                >
                  <Plus className="w-6 h-6 text-[#D4AF37]" />
                  <span className="text-xs text-[#D4AF37] font-sans">추가</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-3">
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              <p className="text-xs text-[#1A3C34]/40 font-sans">
                AI 부적절한 사진 검사 활성화
              </p>
            </div>
            <p className="text-xs text-[#1A3C34]/60 font-sans mt-1 leading-relaxed">
              <span className="text-[#D4AF37]">최소 1장</span> 이상, <span className="text-[#D4AF37]">최대 5장</span>까지 등록 가능합니다
            </p>
          </div>

          {/* Basic Information */}
          <div className="bg-white border border-[#1A3C34]/10 rounded-xl p-5 shadow-sm">
            <h3 className="font-serif text-lg text-[#1A3C34] mb-4">기본 정보</h3>
            <div className="space-y-4">
              {/* Nickname */}
              <div>
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
                  닉네임 *
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                  placeholder="닉네임을 입력하세요"
                  maxLength={20}
                />
              </div>

              {/* Gender - Read Only */}
              <div>
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
                  성별
                </label>
                <input
                  type="text"
                  value={formData.gender}
                  disabled
                  className="w-full px-4 py-2.5 border border-[#1A3C34]/10 rounded-lg text-[#1A3C34]/40 font-sans text-sm bg-[#1A3C34]/5 cursor-not-allowed"
                />
                <p className="text-xs text-[#1A3C34]/40 mt-1 font-sans">
                  성별은 변경할 수 없습니다
                </p>
              </div>

              {/* Birth Date - Read Only */}
              <div>
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
                  생년월일
                </label>
                <input
                  type="text"
                  value={formData.birthDate}
                  disabled
                  className="w-full px-4 py-2.5 border border-[#1A3C34]/10 rounded-lg text-[#1A3C34]/40 font-sans text-sm bg-[#1A3C34]/5 cursor-not-allowed"
                />
                <p className="text-xs text-[#1A3C34]/40 mt-1 font-sans">
                  생년월일은 변경할 수 없습니다
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white border border-[#1A3C34]/10 rounded-xl p-5 shadow-sm">
            <h3 className="font-serif text-lg text-[#1A3C34] mb-4">추가 정보</h3>
            <div className="space-y-4">
              {/* Location */}
              <div>
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
                  지역 *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231A3C34' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  <option value="seoul">서울</option>
                  <option value="busan">부산</option>
                  <option value="incheon">인천</option>
                  <option value="daegu">대구</option>
                  <option value="daejeon">대전</option>
                  <option value="gwangju">광주</option>
                  <option value="ulsan">울산</option>
                  <option value="sejong">세종</option>
                  <option value="gyeonggi">경기</option>
                  <option value="other">기타</option>
                </select>
              </div>

              {/* Religion */}
              <div>
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
                  종교
                </label>
                <select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white appearance-none"
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
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
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
                  className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                  placeholder="키를 입력하세요"
                  maxLength={3}
                />
              </div>

              {/* Smoking */}
              <div>
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
                  흡연 여부
                </label>
                <select
                  value={formData.smoking}
                  onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white appearance-none"
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
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
                  음주 여부
                </label>
                <select
                  value={formData.drinking}
                  onChange={(e) => setFormData({ ...formData, drinking: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white appearance-none"
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
          <div className="bg-white border border-[#1A3C34]/10 rounded-xl p-5 shadow-sm">
            <h3 className="font-serif text-lg text-[#1A3C34] mb-4">자기소개</h3>
            <div className="space-y-4">
              {/* Bio */}
              <div>
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
                  소개 *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={6}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors resize-none bg-white leading-relaxed"
                  placeholder="당신을 표현하는 문장을 작성해주세요..."
                />
                <p className="text-xs text-[#1A3C34]/40 mt-1 font-sans text-right">
                  {formData.bio.length} / 500
                </p>
              </div>

              {/* Kakao ID */}
              <div>
                <label className="block text-xs text-[#1A3C34]/70 font-sans mb-2">
                  카카오톡 ID *
                </label>
                <input
                  type="text"
                  value={formData.kakaoId}
                  onChange={(e) => setFormData({ ...formData, kakaoId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                  placeholder="카카오톡 ID를 입력하세요"
                  maxLength={30}
                />
                <p className="text-xs text-[#1A3C34]/40 mt-1 font-sans">
                  매칭 성사 시 공개됩니다
                </p>
              </div>
            </div>
          </div>

          {/* Required Field Notice */}
          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-4">
            <p className="text-xs text-[#1A3C34]/70 font-sans leading-relaxed">
              <span className="text-[#D4AF37]">*</span> 표시는 필수 입력 항목입니다
            </p>
          </div>

        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-[70px] left-0 right-0 p-6 bg-gradient-to-t from-[#FCFCFA] via-[#FCFCFA] to-transparent z-50 flex justify-center">
        <div className="w-full max-w-md">
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className={`w-full font-sans font-medium py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isDirty
              ? "bg-[#1A3C34] text-white shadow-[#1A3C34]/20 hover:bg-[#1A3C34]/90"
              : "bg-[#1A3C34]/20 text-[#1A3C34]/40 shadow-none cursor-not-allowed"
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