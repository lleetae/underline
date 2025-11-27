import React, { useState } from "react";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { ProfileHeader } from "./ProfileHeader";
import { BookReview } from "./BookReview";
import { ActionSheet } from "./ActionSheet";

export function ProfileDetailView() {
  const profileImage = "https://images.unsplash.com/photo-1761014219896-84159aa7c664";
  const bookCover = "https://images.unsplash.com/photo-1538981457319-5e459479f9d0";
  
  const [selectedQuote, setSelectedQuote] = useState("어떤 결정이 더 좋은 것인지 확인할 방법은 없다. 비교할 근거가 없기 때문이다.");

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FAFAFA] pb-20">
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-[#171717]/5">
          <button className="p-2 -ml-2 rounded-full hover:bg-[#171717]/5 transition-colors text-[#171717]">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="font-sans text-xs font-medium tracking-widest uppercase text-[#171717]/40">Profile</span>
          <button className="p-2 -mr-2 rounded-full hover:bg-[#171717]/5 transition-colors text-[#171717]">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <main className="flex flex-col items-center">
          <ProfileHeader
            imageUrl={profileImage}
            name="민준"
            age="만 28세"
            location="서울 성수동"
            intro="예술, 커피, 그리고 철학의 교차점을 탐구합니다. 깊이 있는 대화를 즐겨요."
          />
          
          <BookReview 
            coverUrl={bookCover} 
            selectedQuote={selectedQuote}
            onQuoteSelect={setSelectedQuote}
          />
        </main>

        {/* Interaction */}
        <ActionSheet selectedQuote={selectedQuote} />
    </div>
  );
}
