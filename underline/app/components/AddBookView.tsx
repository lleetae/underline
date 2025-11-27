import React, { useState } from "react";
import { ArrowLeft, Search, BookOpen, Check, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";

interface AladinBook {
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  isbn13: string;
  cover: string;
  description: string;
  pageCount?: number;
}

interface BookData {
  title: string;
  author: string;
  publisher: string;
  cover: string;
  review: string;
  isbn13: string;
  pageCount?: number;
}

export function AddBookView({
  onComplete,
  onBack
}: {
  onComplete: (data: BookData) => void;
  onBack: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AladinBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<AladinBook | null>(null);
  const [bookReview, setBookReview] = useState("");

  // Mock data for testing (CORS 우회용)
  // const mockBooks: AladinBook[] = [
  //   {
  //     title: "1984",
  //     author: "조지 오웰",
  //     publisher: "민음사",
  //     pubDate: "2003-01-01",
  //     isbn13: "9788937460777",
  //     cover: "https://image.aladin.co.kr/product/46/7/cover/8937460777_1.jpg",
  //     description: "전체주의 사회의 암울한 미래를 그린 디스토피아 소설."
  //   },
  //   {
  //     title: "호밀밭의 파수꾼",
  //     author: "J.D. 샐린저",
  //     publisher: "민음사",
  //     pubDate: "2001-01-01",
  //     isbn13: "9788937460753",
  //     cover: "https://image.aladin.co.kr/product/46/7/cover/8937460750_1.jpg",
  //     description: "청소년의 방황과 성장을 그린 현대 문학의 고전."
  //   }
  // ];

  const searchBooks = async () => {
    if (!searchQuery.trim()) {
      toast.error("검색어를 입력해주세요");
      return;
    }

    setIsSearching(true);

    try {
      // Next.js API route
      const response = await fetch(`/api/books/search?query=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();

      if (data.item && data.item.length > 0) {
        const books: AladinBook[] = data.item.map((item: any) => ({
          title: item.title,
          author: item.author,
          publisher: item.publisher,
          pubDate: item.pubDate,
          isbn13: item.isbn13,
          cover: item.cover,
          description: item.description || "",
          pageCount: item.subInfo?.itemPage || 0
        }));
        setSearchResults(books);
        toast.success(`${books.length}개의 검색 결과를 찾았습니다`);
      } else {
        // API 호출은 성공했지만 검색 결과가 없음
        setSearchResults([]);
        toast.info("검색 결과가 없습니다");
      }
    } catch (error) {
      // API 호출 자체가 실패
      console.error("검색 API 호출 실패:", error);
      setSearchResults([]);
      toast.error("검색에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleBookClick = async (book: AladinBook) => {
    try {
      // Next.js API route
      const response = await fetch(`/api/books/detail/${book.isbn13}`);

      if (response.ok) {
        const data = await response.json();

        if (data.item && data.item.length > 0) {
          const detailBook = data.item[0];
          setSelectedBook({
            ...book,
            description: detailBook.description || book.description,
            cover: detailBook.cover || book.cover,
            pageCount: detailBook.subInfo?.itemPage || book.pageCount || 0
          });
        } else {
          setSelectedBook(book);
        }
      } else {
        // API 호출 실패 시 기본 데이터 사용
        console.error("상세 정보 조회 실패");
        setSelectedBook(book);
      }
    } catch (error) {
      // 에러 발생 시 기본 데이터 사용
      console.error("상세 정보 조회 에러:", error);
      setSelectedBook(book);
    }

    toast.success("책이 선택되었습니다");
  };

  const handleComplete = () => {
    if (!selectedBook) {
      toast.error("책을 선택해주세요");
      return;
    }
    if (!bookReview.trim()) {
      toast.error("감상문을 작성해주세요");
      return;
    }

    onComplete({
      title: selectedBook.title,
      author: selectedBook.author,
      publisher: selectedBook.publisher,
      cover: selectedBook.cover,
      review: bookReview,
      isbn13: selectedBook.isbn13,
      pageCount: selectedBook.pageCount || 0
    });
  };

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#FCFCFA] border-b border-[#1A3C34]/10">
        <div className="flex items-center gap-3 px-6 py-4">
          <button className="p-1 hover:bg-[#1A3C34]/5 rounded-full transition-colors" onClick={onBack}>
            <ArrowLeft className="w-5 h-5 text-[#1A3C34]" />
          </button>
          <h1 className="font-serif text-2xl text-[#1A3C34]">책 추가</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-6 py-6 space-y-6">
          {!selectedBook ? (
            <>
              {/* Search Section */}
              <div>
                <label className="block text-sm text-[#1A3C34]/70 font-sans mb-2">
                  책 검색
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
                    className="flex-1 px-4 py-2.5 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                    placeholder="책 제목 또는 저자명을 입력하세요"
                  />
                  <button
                    onClick={searchBooks}
                    disabled={isSearching}
                    className="px-4 py-2.5 bg-[#1A3C34] text-white hover:bg-[#1A3C34]/90 rounded-lg transition-all duration-300 font-sans text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    검색
                  </button>
                </div>
                <p className="text-xs text-[#1A3C34]/40 mt-1.5 font-sans">
                  당신의 서재에 추가할 책을 찾아보세요
                </p>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <h3 className="font-sans text-sm text-[#1A3C34]/70 mb-3">
                    검색 결과 ({searchResults.length}권)
                  </h3>
                  <div className="space-y-3">
                    {searchResults.map((book, index) => (
                      <button
                        key={index}
                        onClick={() => handleBookClick(book)}
                        className="w-full bg-white border border-[#1A3C34]/10 rounded-lg p-4 hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 text-left"
                      >
                        <div className="flex gap-3">
                          <ImageWithFallback
                            src={book.cover}
                            alt={book.title}
                            className="w-16 h-22 object-cover rounded shadow-sm flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-sm text-[#1A3C34] mb-1 truncate">
                              {book.title}
                            </h4>
                            <p className="text-xs text-[#1A3C34]/60 font-sans mb-0.5 truncate">
                              {book.author}
                            </p>
                            <p className="text-xs text-[#1A3C34]/40 font-sans truncate">
                              {book.publisher} · {book.pubDate}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSearching && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-[#1A3C34]/60 font-sans">검색 중...</p>
                </div>
              )}

              {!isSearching && searchQuery && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-12 h-12 text-[#1A3C34]/20 mb-3" />
                  <p className="text-sm text-[#1A3C34]/60 font-sans">검색 결과가 없습니다</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected Book Display */}
              <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[#D4AF37]/20 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg text-[#1A3C34]">선택한 책</h3>
                  <button
                    onClick={() => {
                      setSelectedBook(null);
                      setBookReview("");
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    className="text-xs text-[#1A3C34]/60 hover:text-[#D4AF37] font-sans transition-colors"
                  >
                    다시 선택
                  </button>
                </div>

                <div className="flex gap-4 mb-4">
                  <ImageWithFallback
                    src={selectedBook.cover}
                    alt={selectedBook.title}
                    className="w-28 h-38 object-cover rounded-lg shadow-md flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="font-serif text-base text-[#1A3C34] mb-2">{selectedBook.title}</h4>
                    <div className="space-y-1 text-xs text-[#1A3C34]/70 font-sans">
                      <p>{selectedBook.author}</p>
                      <p>{selectedBook.publisher}</p>
                    </div>
                  </div>
                </div>

                {/* Aladin Attribution */}
                <div className="flex justify-end items-center gap-2 mt-2">
                  <span className="text-[10px] text-[#1A3C34]/40 font-sans">
                    도서 DB 제공 : 알라딘
                  </span>
                  <a
                    href={selectedBook.isbn13 ? `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${selectedBook.isbn13}` : `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=${encodeURIComponent(selectedBook.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#1A3C34]/60 hover:text-[#D4AF37] font-sans flex items-center gap-0.5 transition-colors"
                  >
                    자세히 보기
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Review Section */}
              <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[#D4AF37]/20 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-serif text-lg text-[#1A3C34]">책 감상문</h3>
                  <div className="h-px flex-1 bg-[#D4AF37]/30" />
                </div>

                <textarea
                  value={bookReview}
                  onChange={(e) => setBookReview(e.target.value)}
                  maxLength={10000}
                  rows={10}
                  className="w-full px-4 py-3 border border-[#1A3C34]/20 rounded-lg text-[#1A3C34] font-serif text-sm focus:outline-none focus:border-[#D4AF37] transition-colors resize-none bg-white leading-relaxed"
                  placeholder="이 책이 당신에게 어떤 의미인가요?&#10;&#10;당신의 마음을 움직인 문장이나 생각을 자유롭게 적어주세요..."
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[#1A3C34]/40 font-sans italic">
                    이 감상문은 다른 사람들에게 공개되며, 매칭의 시작점이 됩니다
                  </p>
                  <p className="text-xs text-[#1A3C34]/60 font-sans text-right">
                    {bookReview.length} / 10,000
                  </p>
                </div>
              </div>

              {/* Complete Button */}
              <div className="pt-2">
                <button
                  onClick={handleComplete}
                  disabled={!bookReview.trim()}
                  className="w-full bg-[#D4AF37] text-white font-sans font-medium py-4 rounded-lg hover:bg-[#D4AF37]/90 transition-all duration-300 shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  책 추가하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}