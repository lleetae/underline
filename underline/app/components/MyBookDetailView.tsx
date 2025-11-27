import React, { useState } from "react";
import { ArrowLeft, BookOpen, Edit2, Trash2, Save, X, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";

interface Book {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  cover: string;
  review: string;
  isbn13?: string;
}

export function MyBookDetailView({
  book,
  onBack,
  onUpdate,
  onDelete,
  isLastBook = false
}: {
  book: Book;
  onBack: () => void;
  onUpdate?: (updatedReview: string) => void;
  onDelete?: () => Promise<void>;
  isLastBook?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReview, setEditedReview] = useState(book.review);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveEdit = () => {
    if (!editedReview.trim()) {
      toast.error("감상문을 입력해주세요");
      return;
    }
    onUpdate?.(editedReview);
    setIsEditing(false);
    toast.success("감상문이 수정되었습니다");
  };

  const handleCancelEdit = () => {
    setEditedReview(book.review);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete?.();
    setShowDeleteModal(false);
    toast.success("책이 삭제되었습니다");
  };

  const handleDeleteClick = () => {
    if (isLastBook) {
      toast.error("최소 1권의 책은 남겨두어야 합니다");
      return;
    }
    setShowDeleteModal(true);
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
            <h1 className="font-serif text-2xl text-[var(--foreground)]">Book Review</h1>
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-[var(--primary)]/10 rounded-full transition-colors"
              >
                <Edit2 className="w-4 h-4 text-[var(--primary)]" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-2 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-6 py-6 space-y-6">
          {/* Book Info Card */}
          <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border-2 border-[var(--primary)]/20 rounded-xl p-6 shadow-sm">
            <div className="flex gap-5 mb-5">
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src={book.cover}
                  alt={book.title}
                  className="w-32 h-44 object-cover rounded-lg shadow-lg"
                />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="font-serif text-xl text-[var(--foreground)] mb-3 leading-snug">
                  {book.title}
                </h2>
                <div className="space-y-1">
                  <p className="text-sm text-[var(--foreground)]/70 font-sans">
                    저자: {book.author}
                  </p>
                  {book.publisher && (
                    <p className="text-sm text-[var(--foreground)]/70 font-sans">
                      출판사: {book.publisher}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Aladin Attribution */}
            <div className="flex justify-end items-center gap-2 mb-4">
              <span className="text-[10px] text-[var(--foreground)]/40 font-sans">
                도서 DB 제공 : 알라딘
              </span>
              <a
                href={book.isbn13 ? `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${book.isbn13}` : `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=${encodeURIComponent(book.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[var(--foreground)]/60 hover:text-[var(--primary)] font-sans flex items-center gap-0.5 transition-colors"
              >
                자세히 보기
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="h-px bg-[var(--primary)]/30 mb-4" />

            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-serif text-base text-[var(--foreground)]">나의 감상</h3>
            </div>
          </div>

          {/* Review Content */}
          {isEditing ? (
            <>
              <div className="bg-white border border-[var(--foreground)]/10 rounded-xl p-6 shadow-sm">
                <textarea
                  value={editedReview}
                  onChange={(e) => setEditedReview(e.target.value)}
                  maxLength={10000}
                  rows={15}
                  className="w-full px-4 py-3 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-serif text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none bg-white leading-relaxed"
                  placeholder="감상문을 작성해주세요..."
                />
                <div className="flex justify-end mt-2">
                  <p className="text-xs text-[var(--foreground)]/60 font-sans">
                    {editedReview.length} / 10,000
                  </p>
                </div>
              </div>

              {/* Edit Action Buttons - Below Textarea */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 border-2 border-[var(--foreground)]/20 text-[var(--foreground)] hover:bg-[var(--foreground)]/5 font-sans font-medium py-3.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  취소
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 font-sans font-medium py-3.5 rounded-lg transition-all duration-300 shadow-lg shadow-[var(--primary)]/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  수정완료하기
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white border border-[var(--foreground)]/10 rounded-xl p-6 shadow-sm">
              <div className="prose prose-sm max-w-none">
                <p className="text-[var(--foreground)] font-serif leading-loose whitespace-pre-wrap break-words">
                  {book.review}
                </p>
              </div>
            </div>
          )}

          {/* Decorative Quote */}
          {!isEditing && (
            <div className="text-center py-4">
              <div className="inline-block px-6 py-3 bg-[var(--primary)]/5 rounded-full border border-[var(--primary)]/20">
                <p className="text-xs text-[var(--primary)] font-serif italic">
                  "책은 마음의 거울이다"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-6">
          <div className="bg-[#FCFCFA] p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-[var(--foreground)]/10">
            <h2 className="font-serif text-xl text-[var(--foreground)] mb-3">
              책을 삭제하시겠습니까?
            </h2>
            <p className="text-sm text-[var(--foreground)]/70 font-sans mb-6 leading-relaxed">
              <span className="font-medium">{book.title}</span>과 작성하신 감상문이 영구적으로 삭제됩니다.<br />
              <span className="text-red-500">이 작업은 취소할 수 없습니다.</span>
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-3.5 bg-[var(--foreground)] text-white font-sans rounded-lg hover:bg-[var(--foreground)]/90 transition-all duration-300 shadow-sm"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="w-full py-3 border-2 border-red-500 text-red-500 font-sans rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}