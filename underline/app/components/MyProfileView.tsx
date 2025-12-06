import React, { useState, useEffect } from "react";
import { ChannelTalk } from "./ChannelTalk";
import { Plus, Edit3, User, LogOut, MapPin, Book as BookIcon } from "lucide-react";

import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MyBookDetailView } from "./MyBookDetailView";
import { AddBookView } from "./AddBookView";
import { ProfileEditView } from "./ProfileEditView";



interface Book {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  cover: string;
  reviewPreview: string;
  review: string;
  pageCount: number;
  isbn13?: string;
}

function TotalPagesStats({ books }: { books: Book[] }) {
  const [count, setCount] = useState(0);
  const totalPages = books.reduce((sum, book) => sum + (book.pageCount || 0), 0);

  React.useEffect(() => {
    let start = 0;
    const end = totalPages;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [totalPages]);

  const rangeSize = 10000;
  const currentRangeStart = Math.floor(count / rangeSize) * rangeSize;
  const currentRangeEnd = currentRangeStart + rangeSize;
  const percentage = Math.min(Math.round(((count - currentRangeStart) / rangeSize) * 100), 100);

  return (
    <div className="w-full py-6 flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[var(--foreground)] font-bold text-lg font-sans">
          지금까지 읽은 페이지
        </span>
        <span className="text-[var(--primary)] font-bold text-lg font-sans">
          {count.toLocaleString()}쪽
        </span>
      </div>

      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[var(--primary)] transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[var(--foreground)]/40 text-sm font-sans">
          {currentRangeStart.toLocaleString()}쪽
        </span>
        <span className="text-[var(--foreground)]/40 text-sm font-sans">
          {currentRangeEnd.toLocaleString()}쪽
        </span>
      </div>

      {percentage >= 100 && (
        <div className="mt-2 text-center">
          <span className="text-[var(--primary)] font-bold text-sm font-sans animate-pulse">
            🎉 목표 달성! 새로운 목표를 설정해보세요
          </span>
        </div>
      )}
    </div>
  );
}

export function MyProfileView({ onLogout, onNavigate, selectedBookId }: { onLogout?: () => void; onNavigate: (view: any, params?: any, options?: { replace?: boolean }) => void; selectedBookId?: string; }) {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [profileData, setProfileData] = useState({
    nickname: "",
    gender: "",
    birthDate: "",
    location: "",
    religion: "",
    height: "",
    smoking: "",
    drinking: "",
    bio: "",
    kakaoId: "",
    profilePhotos: [] as { id: string; url: string }[],
    freeRevealsCount: 0,
    hasWelcomeCoupon: false,
  });

  // const [selectedBook, setSelectedBook] = useState<Book | null>(null); // Removed local state
  const [showAddBookView, setShowAddBookView] = useState(false);
  const [showProfileEditView, setShowProfileEditView] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Derived state for selected book
  const selectedBook = books.find(b => b.id === selectedBookId) || null;

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // 1. Fetch Member Profile
      const { data: member, error: memberError } = await supabase
        .from('member')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (memberError) throw memberError;

      if (member) {
        const originalPhotos = member.photo_urls_original || [];
        const blurredPhotos = member.photo_urls_blurred || [];
        const displayPhotos = blurredPhotos.length > 0 ? blurredPhotos : (member.photos || []);

        // Initial Profile Data (without decrypted Kakao ID)
        setProfileData({
          nickname: member.nickname,
          gender: member.gender,
          birthDate: member.birth_date,
          location: (member.sido && member.sigungu) ? `${member.sido} ${member.sigungu}` : member.location,
          religion: member.religion,
          height: member.height?.toString() || "",
          smoking: member.smoking,
          drinking: member.drinking,
          bio: member.bio,
          kakaoId: member.kakao_id, // Keep encrypted initially
          profilePhotos: displayPhotos.map((url: string, index: number) => ({
            id: index.toString(),
            url: url,
            originalPath: originalPhotos[index],
            blurredUrl: url
          })),
          freeRevealsCount: member.free_reveals_count || 0,
          hasWelcomeCoupon: member.has_welcome_coupon || false,
        });

        // 2. Parallel Operations: Fetch Books & Decrypt Kakao ID
        const booksPromise = supabase
          .from('member_books')
          .select('*')
          .eq('member_id', member.id)
          .order('created_at', { ascending: false });

        // Decrypt Kakao ID in background (not blocking UI)
        if (member.kakao_id) {
          (async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;

              const response = await fetch('/api/decrypt/kakao', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ encryptedId: member.kakao_id })
              });

              if (response.ok) {
                const data = await response.json();
                setProfileData(prev => ({ ...prev, kakaoId: data.decryptedId }));
              }
            } catch (e) {
              console.error("Error decrypting Kakao ID in background:", e);
            }
          })();
        }

        // Wait for books only
        const { data: memberBooks, error: booksError } = await booksPromise;

        if (booksError) throw booksError;

        if (memberBooks) {
          const mappedBooks: Book[] = memberBooks.map(b => ({
            id: b.id,
            title: b.book_title,
            author: b.book_author || "Unknown",
            publisher: "",
            cover: b.book_cover || "",
            review: b.book_review || "",
            reviewPreview: (b.book_review || "").split('\n')[0].slice(0, 80) + "...",
            pageCount: b.page_count || 0,
            isbn13: b.book_isbn13
          }));
          setBooks(mappedBooks);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("프로필 정보를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

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
        onBack={() => window.history.back()}
        onUpdate={async (updatedReview) => {
          try {
            const { error } = await supabase
              .from('member_books')
              .update({ book_review: updatedReview })
              .eq('id', selectedBook.id);

            if (error) throw error;

            setBooks(books.map(b =>
              b.id === selectedBook.id
                ? { ...b, review: updatedReview, reviewPreview: updatedReview.split('\n')[0].slice(0, 80) + "..." }
                : b
            ));
            // setSelectedBook({ ...selectedBook, review: updatedReview }); // No local state update needed
          } catch (error) {
            console.error("Error updating review:", error);
            toast.error("감상문 수정에 실패했습니다");
            throw error; // Re-throw to let MyBookDetailView know it failed
          }
        }}
        onDelete={async () => {
          try {
            const { error } = await supabase
              .from('member_books')
              .delete()
              .eq('id', selectedBook.id);

            if (error) throw error;

            setBooks(books.filter(b => b.id !== selectedBook.id));
            // setSelectedBook(null); // No local state update needed, history back will handle it? No, delete means we should go back.
            window.history.back();
          } catch (error) {
            console.error("Error deleting book:", error);
            toast.error("책 삭제에 실패했습니다");
            throw error; // Re-throw to let child component know
          }
        }}
        isLastBook={books.length <= 1}
      />
    );
  }

  // Show add book view if add book button is clicked
  if (showAddBookView) {
    return (
      <AddBookView
        onComplete={async (newBookData) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              toast.error("로그인이 필요합니다");
              return;
            }

            // Fetch member ID first
            const { data: memberData } = await supabase
              .from('member')
              .select('id')
              .eq('auth_id', user.id)
              .single();

            if (!memberData) throw new Error("Member not found");

            // Save to database
            const { data, error } = await supabase
              .from('member_books')
              .insert({
                member_id: memberData.id, // Use integer ID
                book_title: newBookData.title,
                book_author: newBookData.author,
                book_cover: newBookData.cover,
                book_isbn13: newBookData.isbn13,
                book_review: newBookData.review,
                page_count: newBookData.pageCount || 0
              })
              .select()
              .single();

            if (error) throw error;

            // Update local state
            const newBook: Book = {
              id: data.id,
              title: newBookData.title,
              author: newBookData.author,
              publisher: newBookData.publisher,
              cover: newBookData.cover,
              review: newBookData.review,
              reviewPreview: newBookData.review.split('\n')[0].slice(0, 80) + "...",
              pageCount: newBookData.pageCount || 0,
              isbn13: newBookData.isbn13
            };
            setBooks([newBook, ...books]);
            setShowAddBookView(false);
            toast.success("책이 추가되었습니다");
          } catch (error) {
            console.error("Error adding book:", error);
            toast.error("책 추가에 실패했습니다");
          }
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
        onSave={async (updatedData, deletedPhotos) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              toast.error("로그인이 필요합니다");
              return;
            }

            // 1. Delete removed photos via API (Server-side to bypass RLS)
            if (deletedPhotos && deletedPhotos.length > 0) {
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;

              for (const photo of deletedPhotos) {
                const originalPath = photo.originalPath;
                let blurredPath = null;

                if (photo.blurredUrl || photo.url) {
                  try {
                    const url = photo.blurredUrl || photo.url;
                    const urlObj = new URL(url);
                    const pathParts = urlObj.pathname.split('/profile-photos-blurred/');
                    if (pathParts.length > 1) {
                      blurredPath = pathParts[1];
                    }
                  } catch (e) {
                    console.error("Error parsing URL:", e);
                  }
                }

                if (originalPath || blurredPath) {
                  try {
                    await fetch('/api/delete/photo', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        userId: user.id,
                        originalPath,
                        blurredPath
                      })
                    });
                  } catch (e) {
                    console.error("Failed to delete photo via API:", e);
                    // Continue with other deletions/updates even if one fails
                  }
                }
              }
            }

            // 2. Encrypt Kakao ID if it was changed
            let encryptedKakaoId = updatedData.kakaoId;
            if (updatedData.kakaoId) {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const response = await fetch('/api/encrypt/kakao', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ kakaoId: updatedData.kakaoId })
                });

                if (response.ok) {
                  const data = await response.json();
                  encryptedKakaoId = data.encryptedId;
                }
              } catch (e) {
                console.error("Error encrypting Kakao ID:", e);
              }
            }

            // 3. Update Database
            const originalUrls = updatedData.profilePhotos.map(p => p.originalPath).filter(Boolean);
            const blurredUrls = updatedData.profilePhotos.map(p => p.blurredUrl || p.url);

            const { error } = await supabase
              .from('member')
              .update({
                nickname: updatedData.nickname,
                bio: updatedData.bio,
                kakao_id: encryptedKakaoId,
                photo_urls_original: originalUrls,
                photo_urls_blurred: blurredUrls,
                photos: blurredUrls, // Update legacy column for compatibility
                sido: updatedData.location.split(' ')[0] || '',
                sigungu: updatedData.location.split(' ')[1] || '',
                height: updatedData.height,
                religion: updatedData.religion,
                smoking: updatedData.smoking,
                drinking: updatedData.drinking
              })
              .eq('auth_id', user.id); // Update by auth_id

            if (error) throw error;

            setProfileData({
              ...updatedData,
              freeRevealsCount: profileData.freeRevealsCount,
              hasWelcomeCoupon: profileData.hasWelcomeCoupon
            });
            setShowProfileEditView(false);
            toast.success("프로필이 저장되었습니다");
          } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("프로필 저장에 실패했습니다");
          }
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

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error("로그인 정보가 없습니다.");
        return;
      }

      const response = await fetch('/api/auth/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success("회원 탈퇴가 완료되었습니다.");
        setShowWithdrawModal(false);
        if (onLogout) {
          onLogout(); // Trigger logout cleanup
        } else {
          console.warn("onLogout prop is missing!");
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("회원 탈퇴 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto min-h-screen bg-[#FCFCFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Header */}


      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-40">
        {/* Header */}
        <div className="bg-[#FCFCFA] border-b border-[var(--foreground)]/10">
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
        {/* Profile Summary Card */}
        <div className="px-6 pt-6 pb-4">
          <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[var(--primary)]/20 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              {/* Profile Photo */}
              {profileData.profilePhotos.length > 0 ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--primary)]/30 flex-shrink-0">
                  <ImageWithFallback
                    src={profileData.profilePhotos[0].url}
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
                    {locationMap[profileData.location] || profileData.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio Preview */}
            <div className="mb-4">
              <p className="text-sm text-[var(--foreground)]/80 font-sans leading-relaxed line-clamp-2 break-all">
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

        {/* Coupon Box Summary Button - Reordered */}
        <div className="px-6 pb-2">
          <button
            onClick={() => onNavigate("couponBox")}
            className="w-full bg-white border border-[var(--foreground)]/10 rounded-xl p-5 shadow-sm flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <h3 className="font-sans text-lg text-[var(--foreground)]">내 쿠폰함</h3>
              <span className="text-sm font-sans text-[var(--foreground)]/60">
                {(profileData.freeRevealsCount || 0) + (profileData.hasWelcomeCoupon ? 1 : 0)}장
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--primary)] group-hover:translate-x-1 transition-transform">
              <span className="text-xs font-sans">보러가기</span>
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 9L5 5L1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        </div>

        {/* Total Pages Read Stats */}
        <div className="px-6 pb-2">
          <TotalPagesStats books={books} />
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
                onClick={() => onNavigate("profile", { bookId: book.id })}
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

        {/* Footer Links */}
        <div className="px-6 py-8 text-center">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="text-xs text-[var(--foreground)] opacity-10 hover:opacity-30 underline transition-opacity font-sans"
          >
            회원 탈퇴
          </button>
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

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-[#FCFCFA] p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-[var(--foreground)]/10">
            <h2 className="font-sans text-xl text-[var(--foreground)] mb-3 text-red-600">
              정말 탈퇴하시겠습니까?
            </h2>
            <p className="text-sm text-[var(--foreground)]/70 font-sans mb-6 leading-relaxed">
              탈퇴 시 프로필, 매칭 내역, 대화 내용 등<br />
              <span className="font-bold text-red-500">모든 데이터가 영구적으로 삭제</span>되며<br />
              복구할 수 없습니다.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="w-full py-3.5 bg-[var(--foreground)] text-white font-sans rounded-lg hover:bg-[var(--foreground)]/90 transition-all duration-300 shadow-sm"
              >
                취소하기
              </button>
              <button
                onClick={handleWithdraw}
                className="w-full py-3 border border-red-200 text-red-500 font-sans rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Channel Talk Integration */}
      <ChannelTalk
        pluginKey={process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY || ""}
        memberId={userId}
        profile={{
          name: profileData.nickname,
          mobileNumber: profileData.kakaoId,
          CUSTOM_VALUE_1: profileData.gender,
          CUSTOM_VALUE_2: profileData.location,
        }}
      />
    </div>
  );
}