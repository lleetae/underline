import React from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { cn } from "./ui/utils";

interface BookReviewProps {
  coverUrl: string;
  selectedQuote: string;
  onQuoteSelect: (quote: string) => void;
}

const SelectableSentence = ({
  text,
  isSelected,
  onClick,
}: {
  text: string;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <span
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-300 decoration-clone px-0.5 rounded-sm",
        isSelected
          ? "font-bold text-[#1A3C34] bg-no-repeat bg-bottom bg-[length:100%_0.5em] bg-gradient-to-t from-[#D4AF37]/40 to-[#D4AF37]/40"
          : "text-[#1A3C34]/80 hover:text-[#1A3C34] hover:bg-[#1A3C34]/5"
      )}
    >
      {text}
    </span>
  );
};

export function BookReview({ coverUrl, selectedQuote, onQuoteSelect }: BookReviewProps) {
  const paragraphs = [
    [
      "어떤 책을 읽으면 기묘한 복음적 열정에 사로잡혀, 세상 모든 사람들이 그 책을 읽기 전까지는 부서진 세상이 결코 치유되지 않을 것이라고 확신하게 된다."
    ],
    [
      "이 소설은 체코 사회의 예술적, 지적 삶을 탐구한다. ",
      "영원회귀 사상에 도전하며, 각 사람은 단 한 번의 삶만을 살기에 한 번 일어난 일은 중요하지 않다고 주장한다."
    ],
    [
      "어떤 결정이 더 좋은 것인지 확인할 방법은 없다. 비교할 근거가 없기 때문이다."
    ],
    [
      "우리는 경고 없이, 마치 차가운 무대에 오르는 배우처럼 모든 것을 있는 그대로 살아낸다. ",
      "삶의 첫 리허설이 삶 그 자체라면, 삶은 과연 무슨 가치가 있을까? "
    ],
    [
      "그렇기에 삶은 항상 밑그림과 같다. ",
      "아니, '밑그림'이라는 말은 정확하지 않다. ",
      "밑그림은 무언가의 윤곽, 그림을 위한 준비 작업이지만, 우리 삶이라는 밑그림은 아무것도 아닌 것을 위한 밑그림, 그림 없는 윤곽이기 때문이다."
    ]
  ];

  return (
    <div className="w-full max-w-md px-6 pb-32 text-[#1A3C34]">
      <div className="flex flex-col gap-8">
        <div className="border-t border-[#1A3C34]/10 pt-12">
          <h2 className="text-xs font-sans tracking-[0.2em] uppercase text-[#D4AF37] mb-6 text-center">
            My Life Book
          </h2>
          
          <div className="flex gap-6 items-start">
            <div className="w-24 shrink-0 shadow-md rotate-1 transition-transform hover:rotate-0 duration-300">
               <div className="aspect-[2/3] relative bg-[#e5e5e5]">
                <ImageWithFallback
                  src={coverUrl}
                  alt="Book Cover"
                  className="w-full h-full object-cover"
                />
               </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-serif text-xl leading-tight">
                참을 수 없는 존재의 가벼움
              </h3>
              <p className="text-xs font-sans opacity-60 tracking-wide">
                밀란 쿤데라
              </p>
            </div>
          </div>
        </div>

        <div className="font-serif text-[1.05rem] leading-loose text-[#1A3C34]/90 space-y-6 break-keep">
          {paragraphs.map((paragraphSentences, pIndex) => (
            <p key={pIndex}>
              {paragraphSentences.map((sentence, sIndex) => {
                const active = sentence.trim() === selectedQuote.trim();

                return (
                   <React.Fragment key={sIndex}>
                     <SelectableSentence 
                       text={sentence}
                       isSelected={active}
                       onClick={() => onQuoteSelect(sentence.trim())}
                     />
                   </React.Fragment>
                );
              })}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
