import React, { useState, useEffect } from "react";
import { Plus, Edit3, User, LogOut, MapPin, Book as BookIcon } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MyBookDetailView } from "./MyBookDetailView";
import { AddBookView } from "./AddBookView";
import { ProfileEditView, ProfileData } from "./ProfileEditView";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

interface Book {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  cover: string;
  reviewPreview: string;
  review: string;
}

export function MyProfileView({ onLogout }: { onLogout?: () => void }) {
  const [books, setBooks] = useState<Book[]>([
    {
      id: "1",
      title: "참을 수 없는 존재의 가벼움",
      author: "밀란 쿤데라",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/25/cover/8937462516_1.jpg",
      reviewPreview: "가벼움과 무거움 사이에서 우리는 무엇을 선택해야 할까. 테레사와 토마시의 사랑은...",
      review: "가벼움과 무거움 사이에서 우리는 무엇을 선택해야 할까. 테레사와 토마시의 사랑은 우리에게 질문을 던진다.\\n\\n존재의 가벼움이란 무엇인가? 쿤데라는 니체의 영원회귀 사상을 통해 이를 탐구한다."
    },
    {
      id: "2",
      title: "데미안",
      author: "헤르만 헤세",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/8/cover/8937460882_1.jpg",
      reviewPreview: "새는 알에서 나오려고 투쟁한다. 알은 세계다. 태어나려는 자는...",
      review: "새는 알에서 나오려고 투쟁한다. 알은 세계다. 태어나려는 자는 하나의 세계를 파괴하지 않으면 안 된다."
    },
    {
      id: "3",
      title: "1984",
      author: "조지 오웰",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/7/cover/8937460777_1.jpg",
      reviewPreview: "빅 브라더가 당신을 지켜보고 있다. 전체주의 사회에서의 개인의 자유란...",
      review: "빅 브라더가 당신을 지켜보고 있다. 이 문장만큼 오싹한 경고가 또 있을까."
    },
    {
      id: "4",
      title: "노르웨이의 숲",
      author: "무라카미 하루키",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/59/45/cover/8937461676_1.jpg",
      reviewPreview: "죽음과 상실, 그리고 사랑에 대한 이야기. 와타나베의 청춘은...",
      review: "비틀즈의 'Norwegian Wood'가 흐르면 나는 와타나베가 된다."
    },
    {
      id: "5",
      title: "백년의 고독",
      author: "가브리엘 가르시아 마르케스",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/1/cover/8937461005_1.jpg",
      reviewPreview: "부엔디아 가문의 7대에 걸친 대서사시. 마술적 사실주의의 정점...",
      review: "마콘도라는 마을에서 시작된 부엔디아 가문의 100년."
    },
    {
      id: "6",
      title: "호밀밭의 파수꾼",
      author: "J.D. 샐린저",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/46/7/cover/8937460750_1.jpg",
      reviewPreview: "홀든 콜필드의 방황. 어른이 되기 싫은 소년의 절규...",
      review: "홀든 콜필드는 우리 모두였다. 적어도 한때는."
    },
    {
      id: "7",
      title: "이방인",
      author: "알베르 카뮈",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/59/43/cover/8937460645_1.jpg",
      reviewPreview: "오늘 엄마가 죽었다. 어쩌면 어제였을지도 모른다. 뫼르소의 무관심과...",
      review: "오늘 엄마가 죽었다. 어쩌면 어제였을지도 모른다."
    },
    {
      id: "8",
      title: "죄와 벌",
      author: "표도르 도스토옙스키",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/1/47/cover/8937460645_2.jpg",
      reviewPreview: "라스콜리니코프의 범죄와 그 이후. 양심과 구원에 대한 탐구...",
      review: "라스콜리니코프는 스스로에게 질문한다. 나는 특별한 인간인가?"
    },
    {
      id: "9",
      title: "위대한 개츠비",
      author: "F. 스콧 피츠제럴드",
      publisher: "민음사",
      cover: "https://image.aladin.co.kr/product/2/41/cover/8937460807_1.jpg",
      reviewPreview: "제이 개츠비의 아메리칸 드림. 화려한 파티 뒤에 숨겨진 슬픔...",
      review: "녹색 불빛. 개츠비는 매일 밤 그것을 바라본다."
    },
  ]);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBookView, setShowAddBookView] = useState(false);
  const [showProfileEditView, setShowProfileEditView] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Profile Data State
  const [profileData, setProfileData] = useState<ProfileData & { profilePhoto?: string }>({
    nickname: "",
    gender: "",
    birthDate: "",
    location: "seoul",
    religion: "none",
    height: "",
    smoking: "non-smoker",
    drinking: "social",
    bio: "",
    kakaoId: "",
    profilePhoto: undefined,
    profilePhotos: [],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase.from('member').select('*').eq('auth_id', user.id).single();
      if (member) {
        setProfileData({
          nickname: member.nickname || "",
          gender: member.gender || "",
          birthDate: member.birth_date || "",
          location: member.location || "seoul",
          religion: member.religion || "none",
          height: member.height?.toString() || "",
          smoking: member.smoking || "non-smoker",
          drinking: member.drinking || "non-drinker",
          bio: member.bio || "",
          kakaoId: member.kakao_id || "",
          profilePhoto: member.photo_url,
          profilePhotos: member.photos ? member.photos.map((url: string, idx: number) => ({ id: idx.toString(), url })) : []
        });
      }
    };
    fetchProfile();
  }, []);

  // Location mapping
  const locationMap: { [key: string]: string } = {
    seoul: "서울",
    busan: "부산",
    incheon: "인천",
    daegu: "대구",
    daejeon: "대전",
    gwangju: "광주",
    ulsan: "울산",
    sejong: "세종",
    gyeonggi: "경기",
    other: "기타",
  };

  // Show book detail view if a book is selected
  if (selectedBook) {
    return (
      <MyBookDetailView
        book={selectedBook}
        onBack={() => setSelectedBook(null)}
        onUpdate={(updatedReview) => {
          setBooks(books.map(b =>
            b.id === selectedBook.id
              ? { ...b, review: updatedReview, reviewPreview: updatedReview.split('\n')[0].slice(0, 80) + "..." }
              : b
          ));
          setSelectedBook({ ...selectedBook, review: updatedReview });
        }}
        onDelete={async () => {
          setBooks(books.filter(b => b.id !== selectedBook.id));
          setSelectedBook(null);
        }}
      />
    );
  }

  // Show add book view if add book button is clicked
  if (showAddBookView) {
    return (
      <AddBookView
        onComplete={(newBookData) => {
          const newBook: Book = {
            id: (books.length + 1).toString(),
            title: newBookData.title,
            author: newBookData.author,
            publisher: newBookData.publisher,
            cover: newBookData.cover,
            review: newBookData.review,
            reviewPreview: newBookData.review.split('\n')[0].slice(0, 80) + "..."
          };
          setBooks([...books, newBook]);
          setShowAddBookView(false);
          toast.success("책이 추가되었습니다");
        }}
        onBack={() => setShowAddBookView(false)}
      />
    );
  }

  // Show profile edit view if edit profile button is clicked
  if (showProfileEditView) {
    return (
      <ProfileEditView
        profileData={profileData}
        onBack={() => setShowProfileEditView(false)}
        onSave={async (updatedData, _deletedPhotos) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Calculate age
          let age = 0;
          if (updatedData.birthDate) {
            const birthYear = parseInt(updatedData.birthDate.substring(0, 4));
            const currentYear = new Date().getFullYear();
            age = currentYear - birthYear;
          }

          // Encrypt kakao_id before saving
          let encryptedKakaoId = updatedData.kakaoId;
          try {
            const encryptResponse = await fetch('/api/encrypt/kakao', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ kakaoId: updatedData.kakaoId })
            });

            if (!encryptResponse.ok) {
              throw new Error('카카오톡 ID 암호화 실패');
            }

            const encryptData = await encryptResponse.json();
            encryptedKakaoId = encryptData.encryptedId;
          } catch (encryptError) {
            console.error("Encryption error:", encryptError);
            toast.error("카카오톡 ID 처리 중 오류가 발생했습니다");
            return;
          }

          const photoUrls = updatedData.profilePhotos?.map(p => p.url) || [];

          const { error, count } = await supabase.from('member').update({
            nickname: updatedData.nickname,
            location: updatedData.location,
            religion: updatedData.religion,
            height: parseInt(updatedData.height),
            smoking: updatedData.smoking,
            drinking: updatedData.drinking,
            bio: updatedData.bio,
            kakao_id: encryptedKakaoId,
            age: age,
            photo_url: photoUrls.length > 0 ? photoUrls[0] : null,
            photos: photoUrls
          }, { count: 'exact' }).eq('auth_id', user.id);

          console.log("Update result:", { count, error });

          if (count === 0) {
            console.error("No rows updated! Check auth_id match or RLS policies.");
            toast.error("저장 실패: 사용자 정보를 찾을 수 없습니다.");
            return;
          }

          if (error) {
            console.error("Error saving profile:", error);
            console.error("Error details:", {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
            console.error("Update data:", {
              location: updatedData.location,
              userId: user.id
            });
            toast.error(`저장 실패: ${error.message}`);
            return;
          }

          setProfileData({
            ...updatedData,
            profilePhoto: updatedData.profilePhotos?.[0]?.url
          });
          setShowProfileEditView(false);
          toast.success("프로필이 저장되었습니다");
        }}
      />
    );
  }

  const handleLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FCFCFA] border-b border-[var(--foreground)]/10">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="font-sans text-2xl text-[var(--foreground)]">My Profile</h1>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-2 hover:bg-[var(--foreground)]/5 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5 text-[var(--foreground)]" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {/* Profile Summary Card */}
        <div className="px-6 pt-6 pb-4">
          <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[var(--primary)]/20 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              {/* Profile Photo */}
              {profileData.profilePhoto ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--primary)]/30 flex-shrink-0">
                  <ImageWithFallback
                    src={profileData.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border-2 border-[var(--primary)]/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-10 h-10 text-[var(--primary)]/40" />
                </div>
              )}

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h2 className="font-sans text-xl text-[var(--foreground)] mb-1">
                  {profileData.nickname}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[var(--foreground)]/60 font-sans">
                  <span>{profileData.gender === 'male' ? '남성' : profileData.gender === 'female' ? '여성' : profileData.gender}</span>
                  <span>·</span>
                  <span>{profileData.birthDate.substring(0, 4)}년생</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="text-xs text-[var(--foreground)]/70 font-sans">
                    {locationMap[profileData.location]}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio Preview */}
            <div className="mb-4">
              <p className="text-sm text-[var(--foreground)]/80 font-sans leading-relaxed line-clamp-2">
                {profileData.bio}
              </p>
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={() => setShowProfileEditView(true)}
              className="w-full bg-white border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-sans font-medium py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              프로필 수정하기
            </button>
          </div>
        </div>

        {/* My Library */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-xl text-[var(--foreground)]">My Library</h2>
            <div className="flex items-center gap-1.5 text-sm text-[var(--foreground)]/60 font-sans">
              <BookIcon className="w-4 h-4" />
              <span>{books.length}권</span>
            </div>
          </div>

          {/* 3x3 Grid Layout */}
          <div className="grid grid-cols-3 gap-3">
            {/* Add New Book Button - First Position */}
            <button
              onClick={() => setShowAddBookView(true)}
              className="aspect-[2/3] border-2 border-dashed border-[var(--primary)] rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-[var(--primary)]/5 transition-colors"
            >
              <Plus className="w-6 h-6 text-[var(--primary)]" />
              <span className="text-xs text-[var(--primary)] font-sans">책 추가</span>
            </button>

            {/* Books */}
            {books.map((book) => (
              <button
                key={book.id}
                className="aspect-[2/3] rounded-lg overflow-hidden border border-[var(--foreground)]/10 hover:border-[var(--primary)] hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedBook(book)}
              >
                <ImageWithFallback
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Library Stats */}
          <div className="mt-6 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg p-4">
            <p className="text-sm text-[var(--foreground)]/60 font-sans mb-1">
              나를 가장 잘 설명하는 책은 무엇인가요?
            </p>
            <p className="text-sm text-[var(--primary)] font-sans font-medium">
              책 한 권이 백 마디 말보다 나를 더 잘 보여줍니다
            </p>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-[#FCFCFA] p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-[var(--foreground)]/10">
            <h2 className="font-sans text-xl text-[var(--foreground)] mb-3">
              정말 로그아웃하시나요?
            </h2>
            <p className="text-sm text-[var(--foreground)]/70 font-sans mb-6 leading-relaxed">
              로그아웃하시면 진행 중인 매칭 신청과<br />
              받은 메시지를 확인할 수 없습니다.<br />
              <span className="text-[var(--primary)]">혹시 모를 인연을 놓치실 수도 있어요.</span>
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-3.5 bg-[var(--primary)] text-white font-sans rounded-lg hover:bg-[var(--primary)]/90 transition-all duration-300 shadow-sm"
              >
                계속 사용하기
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-3 border border-[var(--foreground)]/20 text-[var(--foreground)]/60 font-sans rounded-lg hover:bg-[var(--foreground)]/5 transition-colors text-sm"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
