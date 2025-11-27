import React from "react";
import { Send } from "lucide-react";

interface ActionSheetProps {
  selectedQuote: string;
}

export function ActionSheet({ selectedQuote }: ActionSheetProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none flex justify-center">
      <div className="w-full max-w-md bg-[#FCFCFA] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-2xl p-5 pointer-events-auto border border-[var(--foreground)]/5 animate-in slide-in-from-bottom-full duration-500">
        <div className="flex flex-col gap-4">
          <div className="text-center space-y-1">
            <p className="text-sm font-serif italic text-[var(--foreground)] line-clamp-2 px-2">
              "{selectedQuote}"
            </p>
            <p className="text-xs font-sans text-[var(--foreground)]/60 uppercase tracking-wider mt-2">
              이 문장으로 대화를 신청하시겠습니까?
            </p>
          </div>
          
          <button className="w-full bg-[var(--primary)] hover:bg-[#C4A027] text-[#FCFCFA] font-sans font-medium py-3.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
            <span>대화 신청하기</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
