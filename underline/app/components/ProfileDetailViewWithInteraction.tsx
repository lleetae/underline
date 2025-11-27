import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPin, BookOpen, Heart, Send } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { MatchRequestLetterModal } from "./MatchRequestLetterModal";
import { supabase } from "../lib/supabase";

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  review: string;
}

interface ProfileDetailData {
  id: number; // Changed to number
  nickname: string;
  age: number;
  location: string;
  religion: string;
  height: string;
  smoking: string;
  drinking: string;
  bio: string;
  photos: string[];
  books: Book[];
}

export function ProfileDetailViewWithInteraction({
  profileId,
  onBack,
  onMatchRequest,
  sentMatchRequests = [],
  disableMatching = false
}: {
  profileId: string;
  onBack: () => void;
  onMatchRequest?: (profileData: {
    profileId: string;
    nickname: string;
    age: number;
    location: string;
    photo: string;
    letter: string;
  }) => void;
  sentMatchRequests?: Array<{
    profileId: string;
    nickname: string;
    age: number;
    location: string;
    photo: string;
    letter: string;
    timestamp: Date;
  }>;
  disableMatching?: boolean;
}) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<ProfileDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const supabase = createClient(); // Removed local client creation

  // Reset scroll position when profileId changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [profileId]);

  useEffect(() => {
    const fetchProfileDetail = async () => {
      if (!profileId) return;

      setIsLoading(true);
      try {
        // Fetch member details
        const { data: memberData, error: memberError } = await supabase
          .from('member')
          .select('*')
          .eq('id', parseInt(profileId)) // Convert string prop to integer
          .single();

        if (memberError) throw memberError;

        // Fetch member books
        const { data: booksData, error: booksError } = await supabase
          .from('member_books')
          .select('*')
          .eq('member_id', parseInt(profileId)) // Convert string prop to integer
          .order('created_at', { ascending: false });

        if (booksError) throw booksError;

        if (memberData) {
          const books: Book[] = (booksData || []).map((book: any) => ({
            id: book.id,
            title: book.book_title,
            author: book.book_author,
            cover: book.book_cover || "https://via.placeholder.com/150?text=No+Cover",
            review: book.book_review
          }));

          setProfile({
            id: memberData.id,
            nickname: memberData.nickname || "익명",
            age: memberData.age || (memberData.birth_date ? new Date().getFullYear() - parseInt(memberData.birth_date.substring(0, 4)) : 0),
            location: memberData.location || "알 수 없음",
            religion: memberData.religion || "none",
            height: memberData.height || "",
            smoking: memberData.smoking || "non-smoker",
            drinking: memberData.drinking || "non-drinker",
            bio: memberData.bio || "",
            photos: memberData.photos && memberData.photos.length > 0 ? memberData.photos : (memberData.photo_url ? [memberData.photo_url] : []),
            books: books
          });
        }
      } catch (error) {
        console.error("Error fetching profile detail:", error);
        toast.error("프로필 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileDetail();
  }, [profileId]);

  // Check if already sent request to this profile
  const existingRequest = sentMatchRequests.find(req => req.profileId === profileId);
  const isRequestSent = !!existingRequest;

  // Helper function to display religion text
  const getReligionText = (religion: string) => {
    const religionMap: { [key: string]: string } = {
      none: "무교",
      christianity: "기독교",
      catholicism: "천주교",
      buddhism: "불교",
      other: "기타"
    };
    return religionMap[religion] || religion;
  };

  // Helper function to display smoking text
  const getSmokingText = (smoking: string) => {
    const smokingMap: { [key: string]: string } = {
      "non-smoker": "비흡연",
      "smoker": "흡연",
      "quitting": "금연중"
    };
    return smokingMap[smoking] || smoking;
  };

  // Helper function to display drinking text
  const getDrinkingText = (drinking: string) => {
    const drinkingMap: { [key: string]: string } = {
      "non-drinker": "비음주",
      "social": "사회적음주",
      "less-than-4": "월 4회미만",
      "more-than-5": "월 5회이상"
    };
    return drinkingMap[drinking] || drinking;
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
  };

  const handleCloseBookDetail = () => {
    setSelectedBook(null);
  };

  const handleOpenLetterModal = () => {
    setShowLetterModal(true);
  };

  const handleSendLetter = async (letter: string) => {
    if (!onMatchRequest || !profile) return;

    setIsSendingRequest(true);
    try {
      onMatchRequest({
        profileId: profile.id.toString(),
        nickname: profile.nickname,
        age: profile.age,
        location: profile.location,
        photo: profile.photos[0],
        letter: letter,
      });
      toast.success("매칭 신청이 전송되었습니다!");
      setShowLetterModal(false);
      onBack();
    } catch (error) {
      toast.error("매칭 신청 중 오류가 발생했습니다.");
    } finally {
      setIsSendingRequest(false);
    }
  };



  if (isLoading) {
    return (
      <div className="w-full max-w-md relative shadow-2xl shadow-black/5 h-full bg-[#FCFCFA] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-[#1A3C34]/60 font-sans">프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-md relative shadow-2xl shadow-black/5 h-full bg-[#FCFCFA] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <p className="text-sm text-[#1A3C34]/60 font-sans">프로필을 찾을 수 없습니다.</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-[#1A3C34] text-white rounded-lg text-sm font-sans"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Book Detail View
  if (selectedBook) {
    return (
      <div className="w-full max-w-md relative shadow-2xl shadow-black/5 h-full bg-[#FCFCFA] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#FCFCFA]/95 backdrop-blur-sm border-b border-[#1A3C34]/10">
          <div className="flex items-center gap-3 px-6 py-4">
            <button
              onClick={handleCloseBookDetail}
              className="p-1 hover:bg-[#1A3C34]/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A3C34]" />
            </button>
            <h1 className="font-sans text-base text-[#1A3C34]">책 감상문</h1>
          </div>
        </div>

        {/* Book Detail Content */}
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="px-6 py-8 space-y-6">
            {/* Book Header */}
            <div className="flex gap-4 items-start">
              <div className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden border border-[#1A3C34]/10 shadow-lg">
                <ImageWithFallback
                  src={selectedBook.cover}
                  alt={selectedBook.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-xl text-[#1A3C34] mb-2">{selectedBook.title}</h2>
                <p className="text-sm text-[#1A3C34]/60 font-sans mb-4">{selectedBook.author}</p>
              </div>
            </div>

            {/* Review */}
            <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[#D4AF37]/20 rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative z-10 font-serif text-[#1A3C34] leading-relaxed whitespace-pre-wrap">
                {selectedBook.review}
              </div>
            </div>



            {/* Already Sent Notice */}
            {!disableMatching && isRequestSent && existingRequest && (
              <div>
                <div className="flex items-start gap-3 bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-4 mb-3">
                  <Heart className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-[#1A3C34] font-sans font-medium mb-2">
                      내가 보낸 편지
                    </p>
                    <div className="bg-white/60 rounded-lg p-3 border border-[#D4AF37]/20">
                      <p className="font-serif text-sm text-[#1A3C34] leading-relaxed whitespace-pre-wrap">
                        {existingRequest.letter}
                      </p>
                    </div>
                    <p className="text-xs text-[#1A3C34]/50 font-sans mt-2">
                      {new Date(existingRequest.timestamp).toLocaleString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}에 신청하셨습니다
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>



        <style>{`
          @keyframes slide-up {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // Main Profile View with Book Shelf
  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 h-full bg-[#FCFCFA] flex flex-col">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-[#FCFCFA]/95 backdrop-blur-sm border-b border-[#1A3C34]/10">
        <div className="flex items-center gap-3 px-6 py-4">
          <button
            onClick={onBack}
            className="p-1 hover:bg-[#1A3C34]/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#1A3C34]" />
          </button>
          <h1 className="font-sans text-base text-[#1A3C34]">상대프로필</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-32">
        {/* Profile Header */}
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden">
            <ImageWithFallback
              src={profile.photos[0]}
              alt={profile.nickname}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-6 py-8">
            <h2 className="text-white font-sans text-2xl font-medium mb-2">
              {profile.nickname}
            </h2>
            <div className="flex items-center gap-4 text-white/90 mb-3">
              <span className="text-sm font-sans">만 {profile.age}세</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-sans">{profile.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Grid */}
        <div className="px-6 py-4 border-b border-[#1A3C34]/10">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white border border-[#1A3C34]/10 rounded-lg p-3 text-center">
              <p className="text-xs text-[#1A3C34]/50 font-sans mb-1">종교</p>
              <p className="text-sm text-[#1A3C34] font-sans font-medium">
                {getReligionText(profile.religion)}
              </p>
            </div>
            <div className="bg-white border border-[#1A3C34]/10 rounded-lg p-3 text-center">
              <p className="text-xs text-[#1A3C34]/50 font-sans mb-1">키</p>
              <p className="text-sm text-[#1A3C34] font-sans font-medium">{profile.height}</p>
            </div>
            <div className="bg-white border border-[#1A3C34]/10 rounded-lg p-3 text-center">
              <p className="text-xs text-[#1A3C34]/50 font-sans mb-1">흡연</p>
              <p className="text-sm text-[#1A3C34] font-sans font-medium">
                {getSmokingText(profile.smoking)}
              </p>
            </div>
            <div className="bg-white border border-[#1A3C34]/10 rounded-lg p-3 text-center">
              <p className="text-xs text-[#1A3C34]/50 font-sans mb-1">음주</p>
              <p className="text-sm text-[#1A3C34] font-sans font-medium">
                {getDrinkingText(profile.drinking)}
              </p>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="px-6 py-6 border-b border-[#1A3C34]/10">
          <h3 className="font-sans text-sm text-[#1A3C34]/60 mb-2">자기소개</h3>
          <p className="text-[#1A3C34] font-sans leading-relaxed">{profile.bio}</p>
        </div>

        {/* Book Shelf Section */}
        <div className="px-6 py-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-serif text-xl text-[#1A3C34]">나의 책장 {profile.books.length}권</h3>
            <div className="h-px flex-1 bg-[#D4AF37]/20 ml-2" />
          </div>

          {/* Book Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {profile.books.map((book) => (
              <button
                key={book.id}
                onClick={() => handleBookClick(book)}
                className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-[#1A3C34]/10 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <ImageWithFallback
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                  <p className="text-white text-xs font-serif line-clamp-2 leading-tight">
                    {book.title}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Instruction */}
          {!disableMatching && !isRequestSent && (
            <div className="flex items-start gap-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-4">
              <Heart className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#1A3C34] font-sans leading-relaxed">
                  책을 선택하면 감상문을 읽을 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Already Sent Notice */}
          {!disableMatching && isRequestSent && existingRequest && (
            <div>
              <div className="flex items-start gap-3 bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-4 mb-3">
                <Heart className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-[#1A3C34] font-sans font-medium mb-2">
                    내가 보낸 편지
                  </p>
                  <div className="bg-white/60 rounded-lg p-3 border border-[#D4AF37]/20">
                    <p className="font-serif text-sm text-[#1A3C34] leading-relaxed whitespace-pre-wrap">
                      {existingRequest.letter}
                    </p>
                  </div>
                  <p className="text-xs text-[#1A3C34]/50 font-sans mt-2">
                    {new Date(existingRequest.timestamp).toLocaleString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}에 신청하셨습니다
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Floating Match Request Button */}
      {!disableMatching && !isRequestSent && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-6 pb-8">
          <button
            onClick={handleOpenLetterModal}
            className="w-full max-w-md mx-auto bg-[#D4AF37] text-white font-sans font-medium py-4 rounded-xl hover:bg-[#D4AF37]/90 transition-all duration-300 shadow-2xl shadow-[#D4AF37]/30 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span>매칭 신청하기</span>
          </button>
        </div>
      )}

      {/* Letter Modal */}
      <MatchRequestLetterModal
        isOpen={showLetterModal}
        onClose={() => setShowLetterModal(false)}
        onSend={handleSendLetter}
        recipientNickname={profile.nickname}
        recipientPhoto={profile.photos[0]}
        isSending={isSendingRequest}
      />
    </div>
  );
}
