import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner@2.0.3";
import { SignUpStep1Book, Step1Data } from "./signup/SignUpStep1Book";
import { SignUpStep2Basics, Step2Data } from "./signup/SignUpStep2Basics";
import { SignUpStep3Details, Step3Data } from "./signup/SignUpStep3Details";
import { SignUpStep4Admin, Step4Data } from "./signup/SignUpStep4Admin";

export function SignUpView({ onComplete }: { onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);

  const handleStep1Complete = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Complete = (data: Step2Data) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  const handleStep3Complete = (data: Step3Data) => {
    setStep3Data(data);
    setCurrentStep(4);
  };

  const handleStep4Complete = async (data: Step4Data) => {
    const fullUserData = {
      ...step1Data,
      ...step2Data,
      ...step3Data,
      ...data
    };
    console.log("회원가입 완료 데이터:", fullUserData);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("로그인이 필요합니다");
        return;
      }

      const { error } = await supabase
        .from('member')
        .insert({
          id: user.id, // Link to Auth User
          nickname: fullUserData.nickname,
          gender: fullUserData.gender,
          birth_date: fullUserData.birthDate,
          location: fullUserData.location,
          height: fullUserData.height,
          religion: fullUserData.religion,
          smoking: fullUserData.smoking,
          drinking: fullUserData.drinking,
          bio: fullUserData.bio,
          phone_number: "000-0000-0000", // Placeholder or remove column constraint later
          kakao_id: fullUserData.kakaoId,

          // Book Info
          book_title: fullUserData.bookTitle,
          book_cover: fullUserData.bookCover,
          book_review: fullUserData.bookReview,
          book_isbn13: fullUserData.isbn13,

          // Photos (Filter out nulls and map to URLs)
          photos: fullUserData.photos.filter(p => p.url).map(p => p.url)
        });

      if (error) throw error;

      toast.success("회원가입이 완료되었습니다!");
      onComplete?.();
    } catch (error) {
      console.error("Error inserting data:", error);
      toast.error("회원가입 중 오류가 발생했습니다.");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {currentStep === 1 && (
        <SignUpStep1Book
          onNext={handleStep1Complete}
          onBack={handleBack}
          initialData={step1Data || undefined}
        />
      )}
      {currentStep === 2 && (
        <SignUpStep2Basics
          onNext={handleStep2Complete}
          onBack={handleBack}
          initialData={step2Data || undefined}
        />
      )}
      {currentStep === 3 && (
        <SignUpStep3Details
          onNext={handleStep3Complete}
          onBack={handleBack}
          initialData={step3Data || undefined}
        />
      )}
      {currentStep === 4 && (
        <SignUpStep4Admin
          onComplete={handleStep4Complete}
          onBack={handleBack}
          initialData={undefined}
        />
      )}
    </div>
  );
}