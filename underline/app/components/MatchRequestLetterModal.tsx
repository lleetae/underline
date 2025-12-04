import React, { useState } from "react";
import { X, Send } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface MatchRequestLetterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (letter: string) => void;
    recipientNickname: string;
    recipientPhoto: string;
    isSending?: boolean;
}

const MIN_LETTER_LENGTH = 20;
const MAX_LETTER_LENGTH = 1000;

export function MatchRequestLetterModal({
    isOpen,
    onClose,
    onSend,
    recipientNickname,
    recipientPhoto,
    isSending = false
}: MatchRequestLetterModalProps) {
    const [letter, setLetter] = useState("");

    if (!isOpen) return null;

    const letterLength = letter.trim().length;
    const isValid = letterLength >= MIN_LETTER_LENGTH && letterLength <= MAX_LETTER_LENGTH;
    const lengthColor =
        letterLength < MIN_LETTER_LENGTH ? "text-red-500" :
            letterLength > MAX_LETTER_LENGTH ? "text-red-500" :
                "text-[var(--primary)]";

    const handleSend = () => {
        if (isValid && !isSending) {
            onSend(letter.trim());
        }
    };

    const handleClose = () => {
        if (!isSending) {
            onClose();
            setLetter("");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#FCFCFA] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] my-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--foreground)]/10">
                    <h2 className="font-sans text-xl text-[var(--foreground)]">매칭 신청</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSending}
                        className="p-1 hover:bg-[var(--foreground)]/5 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-[var(--foreground)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Recipient Info */}
                    <div className="flex items-center gap-3 bg-white border border-[var(--foreground)]/10 rounded-lg p-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--foreground)]/10 flex-shrink-0">
                            <ImageWithFallback
                                src={recipientPhoto}
                                alt={recipientNickname}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--foreground)]/60 font-sans">받는 사람</p>
                            <p className="font-sans font-medium text-[var(--foreground)]">{recipientNickname}</p>
                        </div>
                    </div>

                    {/* Letter Textarea */}
                    <div>
                        <label className="block text-sm text-[var(--foreground)]/70 font-sans mb-2">
                            매칭 신청 편지
                        </label>
                        <textarea
                            value={letter}
                            onChange={(e) => setLetter(e.target.value)}
                            disabled={isSending}
                            placeholder={`${recipientNickname}님의 어떤 부분이 마음에 들었는지 편지를 적어주세요.\n\n예시:\n"프로필을 보니 저와 비슷한 책을 좋아하시는 것 같아서 매칭 신청을 보냅니다. 특히 '데미안'을 읽으셨다는 점이 인상 깊었어요. 저도 그 책을 통해 많은 위안을 받았거든요. 함께 책 이야기를 나누고 싶습니다."`}
                            className="w-full px-4 py-3 border border-[var(--foreground)]/20 rounded-lg text-[var(--foreground)] font-sans text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                            rows={12}
                            maxLength={MAX_LETTER_LENGTH}
                        />

                        {/* Character Counter */}
                        <div className="flex items-center justify-between mt-2">
                            <p className={`text-xs font-sans ${lengthColor}`}>
                                {letterLength < MIN_LETTER_LENGTH && (
                                    `최소 ${MIN_LETTER_LENGTH}자 이상 작성해주세요 (${MIN_LETTER_LENGTH - letterLength}자 부족)`
                                )}
                                {letterLength >= MIN_LETTER_LENGTH && letterLength <= MAX_LETTER_LENGTH && (
                                    `✓ 작성 완료`
                                )}
                                {letterLength > MAX_LETTER_LENGTH && (
                                    `최대 ${MAX_LETTER_LENGTH}자까지 가능합니다 (${letterLength - MAX_LETTER_LENGTH}자 초과)`
                                )}
                            </p>
                            <p className="text-xs text-[var(--foreground)]/40 font-sans">
                                {letterLength} / {MAX_LETTER_LENGTH}
                            </p>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg p-4">
                        <p className="text-xs text-[var(--foreground)]/70 font-sans leading-relaxed">
                            <strong className="text-[var(--primary)]">💡 작성 팁</strong><br />
                            • 상대방의 프로필에서 공감한 부분을 구체적으로 언급해보세요<br />
                            • 진솔하고 정중한 태도로 작성해주세요<br />
                            • 첫 만남에서 나누고 싶은 이야기를 언급하면 좋아요
                        </p>
                    </div>
                </div>

                {/* Footer - Send Button */}
                <div className="px-6 py-4 border-t border-[var(--foreground)]/10">
                    <button
                        onClick={handleSend}
                        disabled={!isValid || isSending}
                        className="w-full bg-[var(--primary)] text-white font-sans font-medium py-3.5 rounded-lg hover:bg-[var(--primary)]/90 transition-all duration-300 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isSending ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>전송 중...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                <span>매칭 신청 보내기</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
