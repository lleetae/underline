import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPin, BookOpen, Heart, Send, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { MatchRequestLetterModal } from "./MatchRequestLetterModal";
import { supabase } from "../lib/supabase";
import { DecryptedKakaoId } from "./DecryptedKakaoId";
import { CouponSelectionModal } from "./CouponSelectionModal";

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  review: string;
  isbn13?: string;
}

interface ProfileDetailData {
  id: number;
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

  kakaoId?: string;
  gender: string; // Added field
}

export function ProfileDetailViewWithInteraction({
  profileId,
  onBack,
  onNavigate, // New prop
  selectedBookId, // New prop
  onMatchRequest,
  sentMatchRequests = [],
  receivedMatchRequests = [],
  disableMatching = false,
  isMatched = false,
  isWithdrawn = false,
  partnerKakaoId,
  isUnlocked,
  matchId,
  isSpectator = false
}: {
  profileId: string;
  onBack: () => void;
  onNavigate: (view: any, params?: any, options?: { replace?: boolean }) => void; // New prop type
  selectedBookId?: string; // New prop type
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
  receivedMatchRequests?: Array<{
    id: string;
    profileId: string;
    nickname: string;
    age: number;
    location: string;
    photo: string;
    letter: string;
    timestamp: Date;
  }>;
  disableMatching?: boolean;
  isMatched?: boolean;
  isWithdrawn?: boolean;
  partnerKakaoId?: string | null;
  isUnlocked?: boolean;
  matchId?: string | null;
  isSpectator?: boolean;
}) {
  // const [selectedBook, setSelectedBook] = useState<Book | null>(null); // Removed local state
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<ProfileDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [memberInfo, setMemberInfo] = useState<{ id: string; free_reveals_count: number; has_welcome_coupon: boolean } | null>(null);

  // Derived state for selected book
  const selectedBook = profile?.books.find(b => b.id === selectedBookId) || null;

  // Reset scroll position when profileId changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [profileId, selectedBookId]);

  useEffect(() => {
    const fetchProfileDetail = async () => {
      if (!profileId) return;
      // ... (rest of fetch logic remains same)


      setIsLoading(true);
      try {
        // Fetch member details
        const { data: memberData, error: memberError } = await supabase
          .from('member')
          .select('*')
          .eq('id', profileId)
          .single();

        if (memberError) throw memberError;

        // Fetch member books
        const { data: booksData, error: booksError } = await supabase
          .from('member_books')
          .select('*')
          .eq('member_id', profileId)
          .order('created_at', { ascending: false });

        if (booksError) throw booksError;

        if (memberData) {
          const books: Book[] = (booksData || []).map((book: any) => ({
            id: book.id,
            title: book.book_title,
            author: book.book_author,
            cover: book.book_cover || "https://via.placeholder.com/150?text=No+Cover",
            review: book.book_review,
            isbn13: book.book_isbn13
          }));

          let photos = memberData.photos && memberData.photos.length > 0 ? memberData.photos : (memberData.photo_url ? [memberData.photo_url] : []);

          // If matched, show original photos
          if (isMatched) {
            photos = photos.map((url: string) => {
              if (url && url.includes("profile-photos-blurred")) {
                return url.replace("profile-photos-blurred", "profile-photos-original").replace("blurred_", "");
              }
              return url;
            });
          }

          // Handle empty photos (e.g. withdrawn user)
          if (photos.length === 0) {
            photos = ["https://via.placeholder.com/400x500?text=No+Photo"];
          }

          // Use encrypted ID directly
          const kakaoId = partnerKakaoId || memberData.kakao_id;

          setProfile({
            id: memberData.id,
            nickname: memberData.nickname || "익명",
            gender: memberData.gender || "",
            age: memberData.age || (memberData.birth_date ? (() => {
              const birthDate = new Date(memberData.birth_date);
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              return age;
            })() : 0),
            location: memberData.location || "알 수 없음",
            religion: memberData.religion || "none",
            height: memberData.height || "",
            smoking: memberData.smoking || "non-smoker",
            drinking: memberData.drinking || "non-drinker",
            bio: memberData.bio || "",
            photos: photos,
            books: books,
            kakaoId: kakaoId // Set encrypted ID
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
  }, [profileId, isMatched, partnerKakaoId]);

  // Check if request already sent OR received
  const existingRequest = sentMatchRequests.find(req => req.profileId === profileId);
  const isRequestSent = !!existingRequest;
  const isRequestReceived = receivedMatchRequests.some(req => req.profileId === profileId);
  const canRequest = !disableMatching && !isRequestSent && !isRequestReceived && !isMatched && !isWithdrawn && !isSpectator;

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

  // Helper function to display location text
  const getLocationText = (location: string) => {
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
      other: "기타"
    };
    return locationMap[location] || location;
  };

  const handleBookClick = (book: Book) => {
    // setSelectedBook(book);
    onNavigate("profileDetail", { bookId: book.id });
  };

  const handleCloseBookDetail = () => {
    // setSelectedBook(null);
    window.history.back();
  };

  const handleOpenLetterModal = () => {
    setShowLetterModal(true);
  };

  const handleSendLetter = async (letter: string) => {
    if (!onMatchRequest || !profile) return;

    setIsSendingRequest(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get sender's member id
      const { data: senderData, error: senderError } = await supabase
        .from('member')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (senderError || !senderData) throw new Error("Sender profile not found");

      // Insert into match_requests table
      const { data: matchRequest, error: insertError } = await supabase
        .from('match_requests')
        .insert({
          sender_id: senderData.id,
          receiver_id: profile.id,
          letter: letter,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && matchRequest) {
          console.log("Sending notification request...", {
            type: 'match_request',
            targetMemberId: profile.id,
            matchId: matchRequest.id
          });

          const notifyRes = await fetch('/api/notifications/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              type: 'match_request',
              targetMemberId: profile.id, // Pass member ID (int)
              matchId: matchRequest.id
            })
          });

          const notifyData = await notifyRes.json();
          console.log("Notification API Response:", notifyRes.status, notifyData);
        }
      } catch (e) {
        console.error("Error sending notification:", e);
      }

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
      console.error("Error sending match request:", error);
      toast.error("매칭 신청 중 오류가 발생했습니다.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handlePayment = async () => {
    console.log("handlePayment called");
    if (!profile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다.");
        return;
      }

      // Get member id and rewards for the current user
      const { data: member } = await supabase
        .from('member')
        .select('id, free_reveals_count, has_welcome_coupon')
        .eq('auth_id', user.id)
        .single();

      if (!member) {
        toast.error("회원 정보를 찾을 수 없습니다.");
        return;
      }

      console.log("Member data for coupon check:", member);
      setMemberInfo(member);

      // Check if user has ANY coupons
      if ((member.free_reveals_count || 0) > 0 || member.has_welcome_coupon) {
        console.log("Opening coupon modal");
        setShowCouponModal(true);
      } else {
        // No coupons, proceed to full price payment
        processPayment('none', member);
      }
    } catch (error) {
      console.error("Error checking coupons:", error);
      toast.error("오류가 발생했습니다.");
    }
  };

  const handleCouponSelect = (type: 'free' | 'discount' | 'none') => {
    setShowCouponModal(false);
    if (!memberInfo) return;

    if (type === 'free') {
      useFreeReveal(memberInfo);
    } else {
      processPayment(type, memberInfo);
    }
  };

  const useFreeReveal = async (member: { id: string; free_reveals_count: number }) => {
    const matchRequestId = matchId || profileId;
    if (confirm(`무료 열람권이 ${member.free_reveals_count}개 있습니다. 사용하시겠습니까?`)) {
      try {
        const response = await fetch('/api/payments/use-free-reveal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ matchId: matchRequestId }),
        });

        const result = await response.json();
        if (response.ok && result.success) {
          toast.success(`무료 열람권을 사용했습니다. (남은 개수: ${result.remaining}개)`);
          window.location.reload();
        } else {
          toast.error(result.error || "무료 열람권 사용 실패");
        }
      } catch (e) {
        console.error(e);
        toast.error("오류가 발생했습니다.");
      }
    }
  };

  const processPayment = (type: 'discount' | 'none', member: { id: string; has_welcome_coupon: boolean }) => {
    // @ts-ignore
    if (typeof window.AUTHNICE === 'undefined') {
      toast.error("결제 시스템을 불러오지 못했습니다. 새로고침 해주세요.");
      return;
    }

    const matchRequestId = matchId || profileId;
    let amount = 9900;
    let goodsName = '연락처 잠금해제';

    if (type === 'discount' && member.has_welcome_coupon) {
      amount = 4950;
      goodsName = '연락처 잠금해제 (첫 만남 50% 할인)';
    }

    const orderId = `${matchRequestId}_${member.id}`;

    // @ts-ignore
    window.AUTHNICE.requestPay({
      clientId: process.env.NEXT_PUBLIC_NICEPAY_CLIENT_ID || 'S2_ff3bfd3d0db14308b7375e9f74f8b695',
      method: 'card',
      orderId: orderId,
      amount: amount,
      goodsName: goodsName,
      returnUrl: `${window.location.origin}/api/payments/approve`,
      fnError: function (result: any) {
        console.error("NicePayments error:", result);
        toast.error('결제 중 오류가 발생했습니다: ' + result.errorMsg);
      }
    });
  };



  if (isLoading) {
    return (
      <div className="w-full max-w-md relative shadow-2xl shadow-black/5 h-full bg-[#FCFCFA] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-[var(--foreground)]/60 font-sans">프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-md relative shadow-2xl shadow-black/5 h-full bg-[#FCFCFA] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <p className="text-sm text-[var(--foreground)]/60 font-sans">프로필을 찾을 수 없습니다.</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-[var(--foreground)] text-white rounded-lg text-sm font-sans"
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
        <div className="sticky top-0 z-50 bg-[#FCFCFA]/95 backdrop-blur-sm border-b border-[var(--foreground)]/10">
          <div className="flex items-center gap-3 px-6 py-4">
            <button
              onClick={handleCloseBookDetail}
              className="p-1 hover:bg-[var(--foreground)]/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
            </button>
            <h1 className="font-sans text-base text-[var(--foreground)]">책 감상문</h1>
          </div>
        </div>

        {/* Book Detail Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-32">
          <div className="px-6 py-8 space-y-6">
            {/* Book Header */}
            <div className="flex gap-4 items-start">
              <div className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden border border-[var(--foreground)]/10 shadow-lg">
                <ImageWithFallback
                  src={selectedBook.cover}
                  alt={selectedBook.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-xl text-[var(--foreground)] mb-2">{selectedBook.title}</h2>
                <p className="text-sm text-[var(--foreground)]/60 font-sans mb-4">{selectedBook.author}</p>
              </div>
            </div>

            {/* Aladin Attribution */}
            <div className="flex justify-end items-center gap-2 -mt-4 mb-2">
              <span className="text-[10px] text-[var(--foreground)]/40 font-sans">
                도서 DB 제공 : 알라딘
              </span>
              <a
                href={selectedBook.isbn13 ? `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${selectedBook.isbn13}` : `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=${encodeURIComponent(selectedBook.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[var(--foreground)]/60 hover:text-[var(--primary)] font-sans flex items-center gap-0.5 transition-colors"
              >
                자세히 보기
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Review */}
            <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[var(--primary)]/20 rounded-xl p-6 shadow-sm relative overflow-hidden h-96 flex flex-col">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative z-10 font-serif text-[var(--foreground)] leading-relaxed whitespace-pre-wrap break-words flex-1 overflow-y-auto pr-2 scrollbar-thin">
                {selectedBook.review}
              </div>
            </div>



            {/* Already Sent Notice */}
            {!disableMatching && isRequestSent && existingRequest && (
              <div>
                <div className="flex items-start gap-3 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/30 rounded-lg p-4 mb-3">
                  <Heart className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--foreground)] font-sans font-medium mb-2">
                      내가 보낸 편지
                    </p>
                    <div className="bg-white/60 rounded-lg p-3 border border-[var(--primary)]/20">
                      <p className="font-serif text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap break-words">
                        {existingRequest.letter}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--foreground)]/50 font-sans mt-2">
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
      </div >
    );
  }

  // Main Profile View with Book Shelf
  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 h-full bg-[#FCFCFA] flex flex-col">
      <CouponSelectionModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        freeRevealsCount={memberInfo?.free_reveals_count || 0}
        hasWelcomeCoupon={memberInfo?.has_welcome_coupon || false}
        onSelectCoupon={handleCouponSelect}
      />
      {/* Top Navigation */}
      <div className="relative z-10 bg-[#FCFCFA]/95 backdrop-blur-sm border-b border-[var(--foreground)]/10">
        <div className="flex items-center gap-3 px-6 py-4">
          <button
            onClick={onBack}
            className="p-1 hover:bg-[var(--foreground)]/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
          </button>
          <h1 className="font-sans text-base text-[var(--foreground)]">상대프로필</h1>
        </div>
        {/* Withdrawn Banner */}
        {isWithdrawn && (
          <div className="bg-gray-100 px-6 py-2 border-b border-gray-200">
            <p className="text-xs text-gray-500 font-sans text-center">
              탈퇴한 회원입니다.
            </p>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-32">
        {/* Profile Header */}
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden relative group">
            <ImageWithFallback
              src={profile.photos[currentPhotoIndex]}
              alt={profile.nickname}
              className={`w-full h-full object-cover ${!isMatched ? 'blur-md' : ''}`}
            />

            {/* Photo Navigation Overlay */}
            {profile.photos.length > 1 && (
              <>
                {/* Tap Areas */}
                <div className="absolute inset-0 flex">
                  <div
                    className="w-1/2 h-full z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentPhotoIndex > 0) {
                        setCurrentPhotoIndex(prev => prev - 1);
                      }
                    }}
                  />
                  <div
                    className="w-1/2 h-full z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentPhotoIndex < profile.photos.length - 1) {
                        setCurrentPhotoIndex(prev => prev + 1);
                      }
                    }}
                  />
                </div>

                {/* Progress Indicators */}
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                  {profile.photos.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${index === currentPhotoIndex
                        ? "bg-white"
                        : "bg-white/30"
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-6 py-8 pointer-events-none">
            <h2 className="text-white font-sans text-2xl font-medium mb-2">
              {profile.nickname}
            </h2>
            <div className="flex items-center gap-4 text-white/90 mb-3">
              <span className="text-sm font-sans">{profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : profile.gender}</span>
              <span className="text-sm font-sans">만 {profile.age}세</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-sans">{getLocationText(profile.location)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kakao ID Section */}
        {isMatched && (
          <div className="px-6 py-4 bg-[var(--primary)]/5 border-b border-[var(--foreground)]/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
              <p className="text-xs text-[var(--primary)] font-sans font-bold">매칭된 연락처</p>
            </div>

            {isUnlocked ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[var(--foreground)]/10 shadow-sm">
                <div>
                  <p className="text-xs text-[var(--foreground)]/50 font-sans mb-0.5">카카오톡 ID</p>
                  <p className="text-lg text-[var(--foreground)] font-sans font-medium select-all">
                    <DecryptedKakaoId encryptedId={profile.kakaoId} fallback="ID 정보 없음" />
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      if (!profile.kakaoId) return;

                      const { data: { session } } = await supabase.auth.getSession();
                      const token = session?.access_token;

                      if (!token) {
                        toast.error("로그인이 필요합니다");
                        return;
                      }

                      const response = await fetch('/api/decrypt/kakao', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ encryptedId: profile.kakaoId })
                      });

                      if (response.ok) {
                        const data = await response.json();
                        await navigator.clipboard.writeText(data.decryptedId);
                        toast.success("카카오톡 ID가 복사되었습니다");
                      } else {
                        throw new Error("Decryption failed");
                      }
                    } catch (e) {
                      console.error("Copy error:", e);
                      toast.error("복사에 실패했습니다");
                    }
                  }}
                  className="text-xs bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] px-3 py-1.5 rounded-md transition-colors font-sans"
                >
                  복사
                </button>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-[var(--foreground)]/10 shadow-sm text-center">
                <p className="text-sm text-[var(--foreground)]/60 font-sans mb-3">
                  연락처를 확인하려면 잠금해제가 필요합니다.
                </p>
                <button
                  onClick={handlePayment}
                  className="w-full bg-[var(--primary)] text-white font-sans font-medium py-3 rounded-lg hover:bg-[var(--primary)]/90 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span>연락처 잠금해제 (9,900원)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Additional Info Grid */}
        <div className="px-6 py-4 border-b border-[var(--foreground)]/10">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white border border-[var(--foreground)]/10 rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--foreground)]/50 font-sans mb-1">종교</p>
              <p className="text-sm text-[var(--foreground)] font-sans font-medium">
                {getReligionText(profile.religion)}
              </p>
            </div>
            <div className="bg-white border border-[var(--foreground)]/10 rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--foreground)]/50 font-sans mb-1">키</p>
              <p className="text-sm text-[var(--foreground)] font-sans font-medium">{profile.height}</p>
            </div>
            <div className="bg-white border border-[var(--foreground)]/10 rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--foreground)]/50 font-sans mb-1">흡연</p>
              <p className="text-sm text-[var(--foreground)] font-sans font-medium">
                {getSmokingText(profile.smoking)}
              </p>
            </div>
            <div className="bg-white border border-[var(--foreground)]/10 rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--foreground)]/50 font-sans mb-1">음주</p>
              <p className="text-sm text-[var(--foreground)] font-sans font-medium">
                {getDrinkingText(profile.drinking)}
              </p>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="px-6 py-6 border-b border-[var(--foreground)]/10">
          <h3 className="font-sans text-sm text-[var(--foreground)]/60 mb-2">자기소개</h3>
          <p className="text-[var(--foreground)] font-sans leading-relaxed">{profile.bio}</p>
        </div>

        {/* Book Shelf Section */}
        <div className="px-6 py-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="font-serif text-xl text-[var(--foreground)]">{profile.nickname}님의 책장 {profile.books.length}권</h3>
            <div className="h-px flex-1 bg-[var(--primary)]/20 ml-2" />
          </div>

          {/* Book Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {profile.books.map((book) => (
              <button
                key={book.id}
                onClick={() => handleBookClick(book)}
                className="group relative aspect-[2/3] rounded-lg overflow-hidden border border-[var(--foreground)]/10 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
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
            <div className="flex items-start gap-3 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg p-4">
              <Heart className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[var(--foreground)] font-sans leading-relaxed">
                  책을 선택하면 감상문을 읽을 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Already Sent Notice */}
          {!disableMatching && isRequestSent && existingRequest && (
            <div>
              <div className="flex items-start gap-3 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/30 rounded-lg p-4 mb-3">
                <Heart className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-[var(--foreground)] font-sans font-medium mb-2">
                    내가 보낸 편지
                  </p>
                  <div className="bg-white/60 rounded-lg p-3 border border-[var(--primary)]/20">
                    <p className="font-serif text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap break-words">
                      {existingRequest.letter}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--foreground)]/50 font-sans mt-2">
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
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-6 pb-8">
        <button
          onClick={handleOpenLetterModal}
          disabled={!canRequest}
          className={`w-full max-w-md mx-auto font-sans font-medium py-4 rounded-xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-2
            ${canRequest
              ? "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-[var(--primary)]/30"
              : "bg-[#F5F5F0] text-[var(--foreground)]/40 cursor-not-allowed shadow-none"
            }`}
        >
          {isMatched ? (
            <>
              <Heart className="w-5 h-5 fill-current" />
              <span>매칭된 상대입니다</span>
            </>
          ) : isRequestReceived ? (
            <>
              <Heart className="w-5 h-5" />
              <span>매칭 신청을 받았습니다</span>
            </>
          ) : isRequestSent ? (
            <>
              <Send className="w-5 h-5" />
              <span>매칭 신청 완료</span>
            </>
          ) : disableMatching ? (
            <>
              <Heart className="w-5 h-5" />
              <span>매칭 신청 불가</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>매칭 신청하기</span>
            </>
          )}
        </button>
      </div>

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
