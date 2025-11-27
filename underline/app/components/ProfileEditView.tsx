import React, { useState } from "react";
import { ArrowLeft, Save, X, Plus } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";

export interface Photo {
  id: string;
  url: string;
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

export function ProfileEditView({
  profileData,
  onBack,
  onSave,
}: {
  profileData: ProfileData;
  onBack: () => void;
  onSave: (data: ProfileData) => void;
}) {
  const [formData, setFormData] = useState<ProfileData>(profileData);

  const handleSave = () => {
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

    onSave(formData);
    toast.success("프로필이 저장되었습니다");
    onBack();
  };

  const handleAddPhoto = () => {
    if (formData.profilePhotos.length >= 5) {
      toast.error("프로필 사진은 최대 5개까지 등록할 수 있습니다");
      return;
    }
    toast.info("프로필 사진 추가 기능은 준비 중입니다");
  };

  const handleDeletePhoto = (id: string) => {
    if (formData.profilePhotos.length <= 1) {
      toast.error("프로필 사진은 최소 1개 이상 필요합니다");
      return;
    }
    setFormData({
      ...formData,
      profilePhotos: formData.profilePhotos.filter((photo) => photo.id !== id),
    });
    toast.success("사진이 삭제되었습니다");
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
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-6 py-6 space-y-6">
          {/* Profile Photos Section */}
          <div className="bg-white border border-[#1A3C34]/10 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-[#1A3C34]">프로필 사진</h3>
              <span className="text-xs text-[#1A3C34]/60 font-sans">
                {formData.profilePhotos.length} / 5
              </span>
            </div>

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

            <p className="text-xs text-[#1A3C34]/60 font-sans mt-3 leading-relaxed">
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
                  type="text"
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

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-[#D4AF37] text-white font-sans font-medium py-4 rounded-lg hover:bg-[#D4AF37]/90 transition-all duration-300 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}