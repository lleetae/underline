import React, { useState } from "react";
import { SignUpStep1View } from "./SignUpStep1View";
import { SignUpStep2View } from "./SignUpStep2View";

interface Step1Data {
  phoneNumber: string;
  nickname: string;
  gender: "male" | "female" | null;
  birthDate: string;
  location: string;
  religion: string;
  height: string;
  smoking: string;
  drinking: string;
  bio: string;
  kakaoId: string;
  photos: Array<{ id: string; url: string | null }>;
}

interface Step2Data {
  bookTitle: string;
  bookCover: string;
  bookReview: string;
  isbn13: string;
}

export function SignUpView({ onComplete, onBack }: { onComplete?: () => void; onBack?: () => void }) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  const handleStep1Complete = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Complete = (data: Step2Data) => {
    // 실제 구현시: 서버에 전체 회원가입 데이터 전송
    const fullUserData = {
      ...step1Data,
      ...data
    };
    console.log("회원가입 완료 데이터:", fullUserData);
    onComplete?.();
  };

  const handleBackFromStep2 = () => {
    setCurrentStep(1);
  };

  if (currentStep === 1) {
    return (
      <SignUpStep1View
        onNext={handleStep1Complete}
        onBack={onBack}
        initialData={step1Data || undefined}
      />
    );
  }

  return (
    <SignUpStep2View
      onComplete={handleStep2Complete}
      onBack={handleBackFromStep2}
    />
  );
}