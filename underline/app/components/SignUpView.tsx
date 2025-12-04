import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { SignUpStep1Book, Step1Data } from "./signup/SignUpStep1Book";
import { SignUpStep2Basics, Step2Data } from "./signup/SignUpStep2Basics";
import { SignUpStep3Details, Step3Data } from "./signup/SignUpStep3Details";
import { SignUpStep4Admin, Step4Data } from "./signup/SignUpStep4Admin";

export function SignUpView({ onComplete, onBack }: { onComplete?: () => void; onBack?: () => void }) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);

  const STORAGE_KEY = 'signup_progress';

  // Load progress on mount
  React.useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        if (parsed.step1Data) setStep1Data(parsed.step1Data);
        if (parsed.step2Data) setStep2Data(parsed.step2Data);
        if (parsed.step3Data) setStep3Data(parsed.step3Data);

        // Determine step to restore
        if (parsed.step3Data) setCurrentStep(4);
        else if (parsed.step2Data) setCurrentStep(3);
        else if (parsed.step1Data) setCurrentStep(2);
      } catch (e) {
        console.error("Failed to parse saved progress", e);
      }
    }
  }, []);

  const saveProgress = (data: any) => {
    const currentProgress = localStorage.getItem(STORAGE_KEY);
    let parsed = {};
    if (currentProgress) {
      try {
        parsed = JSON.parse(currentProgress);
      } catch (e) {
        // ignore
      }
    }
    const newProgress = { ...parsed, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  };

  const handleStep1Complete = (data: Step1Data) => {
    setStep1Data(data);
    saveProgress({ step1Data: data });
    setCurrentStep(2);
  };

  const handleStep2Complete = (data: Step2Data) => {
    setStep2Data(data);
    saveProgress({ step2Data: data });
    setCurrentStep(3);
  };

  const handleStep3Complete = (data: Step3Data) => {
    setStep3Data(data);
    saveProgress({ step3Data: data });
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

      // ⚠️ SECURITY: Encrypt Kakao ID before storing
      // TODO: Implement encryption via API route
      // For now, we store as-is but this should be encrypted
      // See: /docs/supabase-security-setup.sql for encryption setup
      let encryptedKakaoId = fullUserData.kakaoId;

      try {
        // Call encryption API
        const encryptResponse = await fetch('/api/encrypt/kakao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kakaoId: fullUserData.kakaoId })
        });

        if (encryptResponse.ok) {
          const { encryptedId } = await encryptResponse.json();
          encryptedKakaoId = encryptedId;
        } else {
          console.warn('Encryption failed, storing unencrypted (NOT RECOMMENDED)');
          toast.error("보안 설정 오류가 발생했습니다");
          return;
        }
      } catch (encryptError) {
        console.error('Encryption error:', encryptError);
        toast.error("보안 설정 오류가 발생했습니다");
        return;
      }

      // Calculate age from birth date
      let age = 0;
      if (fullUserData.birthDate) {
        const birthYear = parseInt(fullUserData.birthDate.substring(0, 4));
        const currentYear = new Date().getFullYear();
        age = currentYear - birthYear;
      }

      // Get first photo URL for photo_url field
      const photoUrl = fullUserData.photos.length > 0 && fullUserData.photos[0].blurredUrl
        ? fullUserData.photos[0].blurredUrl
        : null;

      const { data: newMember, error } = await supabase
        .from('member')
        .insert({
          auth_id: user.id, // Link to Auth User via auth_id
          // id: user.id, // REMOVED: Let DB auto-increment integer ID
          nickname: fullUserData.nickname,
          gender: fullUserData.gender,
          birth_date: fullUserData.birthDate,
          age: age, // ✅ Add age field
          sido: fullUserData.sido,
          sigungu: fullUserData.sigungu,
          // location: fullUserData.location, // REMOVED: Column dropped
          height: fullUserData.height,
          religion: fullUserData.religion,
          smoking: fullUserData.smoking,
          drinking: fullUserData.drinking,
          bio: fullUserData.bio,
          kakao_id: encryptedKakaoId, // ✅ Now encrypted
          // Photos
          photo_url: photoUrl, // ✅ Add photo_url field (first photo)
          photos: fullUserData.photos.filter(p => p.blurredUrl).map(p => p.blurredUrl), // Default to blurred for public
          photo_urls_original: fullUserData.photos.filter(p => p.originalPath).map(p => p.originalPath),
          photo_urls_blurred: fullUserData.photos.filter(p => p.blurredUrl).map(p => p.blurredUrl),
          referrer_auth_id: (localStorage.getItem('referrer_id') && localStorage.getItem('referrer_id') !== '') ? localStorage.getItem('referrer_id') : null // Add referrer Auth ID
        })
        .select()
        .single();

      if (error) throw error;

      if (!newMember) throw new Error("Failed to create member");

      // Insert into member_books using the new integer ID
      const { error: bookError } = await supabase
        .from('member_books')
        .insert({
          member_id: newMember.id, // Use the integer ID from the new member
          book_title: fullUserData.bookTitle,
          book_author: fullUserData.bookAuthor,
          book_cover: fullUserData.bookCover,
          book_genre: fullUserData.bookGenre,
          book_isbn13: fullUserData.isbn13,
          book_review: fullUserData.bookReview,
          page_count: fullUserData.pageCount || 0
        });

      if (bookError) throw bookError;

      // Clear progress on success
      localStorage.removeItem(STORAGE_KEY);

      // If signed up with referral, set flag for Welcome Modal
      if (localStorage.getItem('referrer_id')) {
        sessionStorage.setItem('showWelcomeModal', 'true');
        localStorage.removeItem('referrer_id'); // Clean up
      }

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
    } else {
      onBack?.();
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