import React, { useState } from "react";
import { Search, BookOpen, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";
import { SignUpHeader } from "./SignUpHeader";

interface AladinBook {
    title: string;
    author: string;
    publisher: string;
    pubDate: string;
    isbn13: string;
    cover: string;
    description: string;
    categoryName?: string;
    pageCount?: number;
}

export interface Step1Data {
    bookTitle: string;
    bookCover: string;
    bookReview: string;
    isbn13: string;
    bookAuthor: string;
    bookGenre: string;
    pageCount?: number;
}

export function SignUpStep1Book({
    onNext,
    onBack,
    initialData
}: {
    onNext: (data: Step1Data) => void;
    onBack: () => void;
    initialData?: Partial<Step1Data>;
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<AladinBook[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedBook, setSelectedBook] = useState<AladinBook | null>(
        initialData?.bookTitle ? {
            title: initialData.bookTitle,
            author: initialData.bookAuthor || "",
            publisher: "",
            pubDate: "",
            isbn13: initialData.isbn13 || "",
            cover: initialData.bookCover || "",
            description: "",
            categoryName: initialData.bookGenre || ""
        } : null
    );
    const [bookReview, setBookReview] = useState(initialData?.bookReview || "");

    // Mock data for testing (CORS 우회용)
    const mockBooks: AladinBook[] = [
        {
            title: "참을 수 없는 존재의 가벼움",
            author: "밀란 쿤데라",
            publisher: "민음사",
            pubDate: "1990-01-01",
            isbn13: "9788937462511",
            cover: "https://image.aladin.co.kr/product/46/25/cover/8937462516_1.jpg",
            description: "밀란 쿤데라의 대표작. 존재의 무거움과 가벼움에 대한 철학적 성찰을 담은 소설.",
            categoryName: "소설/시/희곡"
        },
        {
            title: "데미안",
            author: "헤르만 헤세",
            publisher: "민음사",
            pubDate: "2000-01-01",
            isbn13: "9788937460883",
            cover: "https://image.aladin.co.kr/product/46/8/cover/8937460882_1.jpg",
            description: "자아를 찾아가는 젊은이의 성장 소설. 헤르만 헤세의 명작.",
            categoryName: "소설/시/희곡"
        }
    ];

    const searchBooks = async () => {
        if (!searchQuery.trim()) {
            toast.error("검색어를 입력해주세요");
            return;
        }

        setIsSearching(true);

        try {
            // 로컬 백엔드 API 호출
            const response = await fetch(`/api/books/search?query=${encodeURIComponent(searchQuery)}`);
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
                    categoryName: item.categoryName,
                    pageCount: item.subInfo?.itemPage || 0
                }));
                setSearchResults(books);
                toast.success(`${books.length}개의 검색 결과를 찾았습니다`);
            } else {
                setSearchResults([]);
                toast.info("검색 결과가 없습니다");
            }
        } catch (error) {
            console.log("API 호출 실패, mock 데이터 사용", error);
            const filtered = mockBooks.filter(book =>
                book.title.includes(searchQuery) || book.author.includes(searchQuery)
            );
            setSearchResults(filtered.length > 0 ? filtered : mockBooks);
            toast.warning("검색에 실패했습니다. Mock 데이터를 표시합니다.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleBookClick = async (book: AladinBook) => {
        try {
            // 로컬 백엔드 API 호출
            const response = await fetch(`/api/books/detail/${book.isbn13}`);
            const data = await response.json();

            if (data.item && data.item.length > 0) {
                const detailBook = data.item[0];
                setSelectedBook({
                    ...book,
                    description: detailBook.description || book.description,
                    cover: detailBook.cover || book.cover,
                    categoryName: detailBook.categoryName || book.categoryName,
                    pageCount: detailBook.subInfo?.itemPage || book.pageCount || 0
                });
            } else {
                setSelectedBook(book);
            }
        } catch (error) {
            console.log("상세 정보 조회 실패", error);
            setSelectedBook(book);
        }

        toast.success("책이 선택되었습니다");
    };

    const handleNext = () => {
        if (!selectedBook) {
            toast.error("책을 선택해주세요");
            return;
        }
        if (!bookReview.trim()) {
            toast.error("감상문을 작성해주세요");
            return;
        }

        onNext({
            bookTitle: selectedBook.title,
            bookCover: selectedBook.cover,
            bookReview: bookReview,
            isbn13: selectedBook.isbn13,
            bookAuthor: selectedBook.author,
            bookGenre: selectedBook.categoryName || "기타",
            pageCount: selectedBook.pageCount || 0
        });
    };

    return (
        <div className="w-full max-w-md mx-auto relative shadow-2xl shadow-black/5 h-[100dvh] overflow-hidden bg-[#FCFCFA] flex flex-col">
            <SignUpHeader
                currentStep={1}
                totalSteps={4}
                onBack={onBack}
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 space-y-6">
                    {!selectedBook ? (
                        <>
                            {/* Search Section */}
                            <div>
                                <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                                    책 검색
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
                                        className="flex-1 px-4 py-2.5 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                                        placeholder="책 제목 또는 저자명을 입력하세요"
                                    />
                                    <button
                                        onClick={searchBooks}
                                        disabled={isSearching}
                                        className="px-4 py-2.5 bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 rounded-lg transition-all duration-300 font-sans text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Search className="w-4 h-4" />
                                        검색
                                    </button>
                                </div>
                                <p className="text-xs text-[var(--foreground)]/40 mt-1.5 font-sans">
                                    당신의 인생을 바꾼 책을 찾아보세요
                                </p>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div>
                                    <h3 className="font-sans text-sm text-[var(--foreground)]/70 mb-3">
                                        검색 결과 ({searchResults.length}권)
                                    </h3>
                                    <div className="space-y-3">
                                        {searchResults.map((book, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleBookClick(book)}
                                                className="w-full bg-white border border-[var(--foreground)]/10 rounded-lg p-4 hover:border-[var(--primary)] hover:shadow-md transition-all duration-300 text-left"
                                            >
                                                <div className="flex gap-3">
                                                    <ImageWithFallback
                                                        src={book.cover}
                                                        alt={book.title}
                                                        className="w-16 h-22 object-cover rounded shadow-sm flex-shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-serif text-sm text-[var(--foreground)] mb-1 truncate">
                                                            {book.title}
                                                        </h4>
                                                        <p className="text-xs text-[var(--foreground)]/60 font-sans mb-0.5 truncate">
                                                            {book.author}
                                                        </p>
                                                        <p className="text-xs text-[var(--foreground)]/40 font-sans truncate">
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
                                    <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <p className="text-sm text-[var(--foreground)]/60 font-sans">검색 중...</p>
                                </div>
                            )}

                            {!isSearching && searchQuery && searchResults.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <BookOpen className="w-12 h-12 text-[var(--foreground)]/20 mb-3" />
                                    <p className="text-sm text-[var(--foreground)]/60 font-sans">검색 결과가 없습니다</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Selected Book Display */}
                            <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[var(--primary)]/20 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-serif text-lg text-[var(--foreground)]">선택한 책</h3>
                                    <button
                                        onClick={() => {
                                            setSelectedBook(null);
                                            setBookReview("");
                                            setSearchResults([]);
                                            setSearchQuery("");
                                        }}
                                        className="text-xs text-[var(--foreground)]/60 hover:text-[var(--primary)] font-sans transition-colors"
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
                                        <h4 className="font-serif text-base text-[var(--foreground)] mb-2">{selectedBook.title}</h4>
                                        <div className="space-y-1 text-xs text-[var(--foreground)]/70 font-sans">
                                            <p>{selectedBook.author}</p>
                                            <p>{selectedBook.publisher}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Aladin Attribution */}
                                <div className="flex justify-end items-center gap-2 mt-2">
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
                            </div>

                            {/* Review Section */}
                            <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[var(--primary)]/20 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="font-serif text-lg text-[var(--foreground)]">책 감상문</h3>
                                    <div className="h-px flex-1 bg-[var(--primary)]/30" />
                                </div>

                                <textarea
                                    value={bookReview}
                                    onChange={(e) => setBookReview(e.target.value)}
                                    maxLength={10000}
                                    rows={10}
                                    className="w-full px-4 py-3 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none bg-white leading-relaxed"
                                    placeholder="이 책이 당신에게 어떤 의미인가요?&#10;&#10;당신의 마음을 움직인 문장이나 생각을 자유롭게 적어주세요..."
                                />
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs text-[var(--foreground)]/40 font-sans italic">
                                        이 감상문은 다른 사람들에게 공개되며, 매칭의 시작점이 됩니다
                                    </p>
                                    <p className="text-xs text-[var(--foreground)]/60 font-sans text-right">
                                        {bookReview.length} / 10,000
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Action */}
            <div className="bg-[#FCFCFA] border-t border-[var(--foreground)]/10 px-6 py-4">
                <button
                    onClick={handleNext}
                    disabled={!selectedBook || !bookReview.trim()}
                    className={`w-full font-sans font-medium py-3.5 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2
                        ${!selectedBook || !bookReview.trim()
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 shadow-[var(--primary)]/20"
                        }`}
                >
                    다음 단계
                </button>
            </div>
        </div>
    );
}
