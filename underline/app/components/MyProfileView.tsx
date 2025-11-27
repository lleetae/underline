import React, { useState, useEffect } from "react";
import { Plus, Edit3, User, LogOut, MapPin, Book as BookIcon } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MyBookDetailView } from "./MyBookDetailView";
import { AddBookView } from "./AddBookView";
import { ProfileEditView } from "./ProfileEditView";
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
        <span className="text-[#1A3C34] font-bold text-lg font-sans">
          지금까지 읽은 페이지
        </span>
        <span className="text-[#D4AF37] font-bold text-lg font-sans">
          {count.toLocaleString()}쪽
        </span>
      </div>

      <div className="relative h-4 bg-[#1A3C34]/5 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[#D4AF37] transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[#1A3C34]/40 text-sm font-sans">
          {currentRangeStart.toLocaleString()}쪽
        </span>
        <span className="text-[#1A3C34]/40 text-sm font-sans">
          {currentRangeEnd.toLocaleString()}쪽
        </span>
      </div>

      {percentage >= 100 && (
        <div className="mt-2 text-center">
          <span className="text-[#D4AF37] font-bold text-sm font-sans animate-pulse">
            🎉 목표 달성! 새로운 목표를 설정해보세요
          </span>
        </div>
      )}
    </div>
  );
}

export function MyProfileView({ onLogout }: { onLogout?: () => void }) {
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
  });

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBookView, setShowAddBookView] = useState(false);
  const [showProfileEditView, setShowProfileEditView] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Handle not logged in - maybe redirect or show empty?
        setLoading(false);
        return;
      }

      // 1. Fetch Member Profile
      const { data: member, error: memberError } = await supabase
        .from('member')
        .select('*')
        .eq('id', user.id)
        .single();

      if (memberError) throw memberError;

      if (member) {
        setProfileData({
          nickname: member.nickname,
          gender: member.gender,
          birthDate: member.birth_date,
          location: member.location,
          religion: member.religion,
          height: member.height?.toString() || "",
          smoking: member.smoking,
          drinking: member.drinking,
          bio: member.bio,
          kakaoId: member.kakao_id,
          profilePhotos: (member.photos || []).map((url: string, index: number) => ({
            id: index.toString(),
            url: url
          }))
        });
      }

      // 2. Fetch Member Books
      const { data: memberBooks, error: booksError } = await supabase
        .from('member_books')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (booksError) throw booksError;

      if (memberBooks) {
        const mappedBooks: Book[] = memberBooks.map(b => ({
          id: b.id,
          title: b.book_title,
          author: b.book_author || "Unknown",
          publisher: "", // Not stored in DB currently
          cover: b.book_cover || "",
          review: b.book_review || "",
          reviewPreview: (b.book_review || "").split('\n')[0].slice(0, 80) + "...",
          pageCount: b.page_count || 0,
          isbn13: b.book_isbn13
        }));
        setBooks(mappedBooks);
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
        onBack={() => setSelectedBook(null)}
        onUpdate={(updatedReview) => {
          setBooks(books.map(b =>
            b.id === selectedBook.id
              ? { ...b, review: updatedReview, reviewPreview: updatedReview.split('\n')[0].slice(0, 80) + "..." }
              : b
          ));
          setSelectedBook({ ...selectedBook, review: updatedReview });
        }}
        onDelete={() => {
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
        onComplete={async (newBookData) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              toast.error("로그인이 필요합니다");
              return;
            }

            // Save to database
            const { data, error } = await supabase
              .from('member_books')
              .insert({
                member_id: user.id,
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
            setBooks([...books, newBook]);
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
        onSave={(updatedData) => {
          setProfileData(updatedData);
          setShowProfileEditView(false);
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

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto min-h-screen bg-[#FCFCFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FCFCFA] border-b border-[#1A3C34]/10">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="font-serif text-2xl text-[#1A3C34]">My Profile</h1>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-2 hover:bg-[#1A3C34]/5 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5 text-[#1A3C34]" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Profile Summary Card */}
        <div className="px-6 pt-6 pb-4">
          <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[#D4AF37]/20 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              {/* Profile Photo */}
              {profileData.profilePhotos.length > 0 ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#D4AF37]/30 flex-shrink-0">
                  <ImageWithFallback
                    src={profileData.profilePhotos[0].url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border-2 border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-10 h-10 text-[#D4AF37]/40" />
                </div>
              )}

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-xl text-[#1A3C34] mb-1">
                  {profileData.nickname}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#1A3C34]/60 font-sans">
                  <span>{profileData.gender}</span>
                  <span>·</span>
                  <span>{profileData.birthDate.substring(0, 4)}년생</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-xs text-[#1A3C34]/70 font-sans">
                    {locationMap[profileData.location]}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio Preview */}
            <div className="mb-4">
              <p className="text-sm text-[#1A3C34]/80 font-sans leading-relaxed line-clamp-2">
                {profileData.bio}
              </p>
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={() => setShowProfileEditView(true)}
              className="w-full bg-white border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white font-sans font-medium py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              프로필 수정하기
            </button>
          </div>
        </div>

        {/* Total Pages Read Stats */}
        <div className="px-6 pb-2">
          <TotalPagesStats books={books} />
        </div>

        {/* My Library */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-[#1A3C34]">My Library</h2>
            <div className="flex items-center gap-1.5 text-sm text-[#1A3C34]/60 font-sans">
              <BookIcon className="w-4 h-4" />
              <span>{books.length}권</span>
            </div>
          </div>

          {/* 3x3 Grid Layout */}
          <div className="grid grid-cols-3 gap-3">
            {/* Add New Book Button - First Position */}
            <button
              onClick={() => setShowAddBookView(true)}
              className="aspect-[2/3] border-2 border-dashed border-[#D4AF37] rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-[#D4AF37]/5 transition-colors"
            >
              <Plus className="w-6 h-6 text-[#D4AF37]" />
              <span className="text-xs text-[#D4AF37] font-sans">책 추가</span>
            </button>

            {/* Books */}
            {books.map((book) => (
              <button
                key={book.id}
                className="aspect-[2/3] rounded-lg overflow-hidden border border-[#1A3C34]/10 hover:border-[#D4AF37] hover:shadow-lg transition-all cursor-pointer"
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
          <div className="mt-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-4">
            <p className="text-xs text-center text-[#1A3C34]/70 font-sans leading-relaxed">
              책을 추가하면 다른 사람들에게 당신의 취향이 공개되며,<br />
              <span className="text-[#D4AF37]">더 잘 맞는 매칭을 찾을 수 있습니다</span>
            </p>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-[#FCFCFA] p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-[#1A3C34]/10">
            <h2 className="font-serif text-xl text-[#1A3C34] mb-3">
              정말 로그아웃하시나요?
            </h2>
            <p className="text-sm text-[#1A3C34]/70 font-sans mb-6 leading-relaxed">
              로그아웃하시면 진행 중인 매칭 신청과<br />
              받은 메시지를 확인할 수 없습니다.<br />
              <span className="text-[#D4AF37]">혹시 모를 인연을 놓치실 수도 있어요.</span>
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-3.5 bg-[#D4AF37] text-white font-sans rounded-lg hover:bg-[#D4AF37]/90 transition-all duration-300 shadow-sm"
              >
                계속 사용하기
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-3 border border-[#1A3C34]/20 text-[#1A3C34]/60 font-sans rounded-lg hover:bg-[#1A3C34]/5 transition-colors text-sm"
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