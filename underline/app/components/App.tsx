"use client";

import React, { useState, useEffect } from "react";
import { ProfileDetailViewWithInteraction } from "./ProfileDetailViewWithInteraction";
import { MailboxView } from "./MailboxView";
import { MyProfileView } from "./MyProfileView";
import { SignUpView } from "./SignUpView";
import { HomeRecruitingView } from "./HomeRecruitingView";
import { HomeDatingView } from "./HomeDatingView";
import { BottomNav } from "./mailbox/BottomNav";
import { LoginModal } from "./LoginModal";
import { Toaster } from "sonner";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); // Added for HomeRecruitingView compatibility

  const [currentView, setCurrentView] = useState<"signup" | "home" | "mailbox" | "profile" | "profileDetail">("home");
  const [isDatingPhase, setIsDatingPhase] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileSource, setProfileSource] = useState<"home" | "mailbox">("home");
  const [mailboxActiveTab, setMailboxActiveTab] = useState<"matched" | "sent" | "messages">("matched");
  const [sentMatchRequests, setSentMatchRequests] = useState<Array<{
    profileId: string;
    nickname: string;
    age: number;
    location: string;
    photo: string;
    sentence: string;
    timestamp: Date;
  }>>([
    {
      profileId: "profile1",
      nickname: "책읽는여름",
      age: 28,
      location: "서울 성동구",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      sentence: "가벼움과 무거움 사이에서 우리는 무엇을 선택해야 할까.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      profileId: "profile2",
      nickname: "산책하는사람",
      age: 30,
      location: "서울 강남구",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      sentence: "새는 알에서 나오려고 투쟁한다. 알은 세계다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      profileId: "profile3",
      nickname: "커피애호가",
      age: 27,
      location: "서울 마포구",
      photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
      sentence: "사랑이란 타인을 통해 자기 자신을 발견하는 과정이다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
  ]);

  const [receivedMatchRequests, setReceivedMatchRequests] = useState<Array<{
    id: string;
    profileId: string;
    nickname: string;
    age: number;
    location: string;
    photo: string;
    sentence: string;
    timestamp: Date;
  }>>([
    {
      id: "received1",
      profileId: "profile4",
      nickname: "북카페순례자",
      age: 29,
      location: "서울 용산구",
      photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      sentence: "인생은 B와 D 사이의 C다. 탄생(Birth)과 죽음(Death) 사이의 선택(Choice).",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "received2",
      profileId: "profile5",
      nickname: "밤하늘독서",
      age: 26,
      location: "서울 종로구",
      photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
      sentence: "우리는 모두 별이 되기 위해 어둠 속을 헤매고 있다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: "received3",
      profileId: "profile6",
      nickname: "조용한오후",
      age: 31,
      location: "서울 서초구",
      photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
      sentence: "진정한 여행은 새로운 풍경을 보는 것이 아니라 새로운 눈을 갖는 것이다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  ]);

  // Check Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkProfile(session.user.id);
      } else {
        setIsSignedUp(false);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkProfile(session.user.id);
      } else {
        setHasProfile(false);
        setIsSignedUp(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (userId: string) => {
    try {
      const { data, error: _error } = await supabase
        .from('member')
        .select('id')
        .eq('auth_id', userId) // Query by auth_id (UUID) instead of id (BIGINT)
        .single();

      if (data) {
        setHasProfile(true);
        setIsSignedUp(true);
      } else {
        setHasProfile(false);
        setIsSignedUp(false);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpComplete = () => {
    setHasProfile(true);
    setIsSignedUp(true);
    setCurrentView("home");
  };

  const handleBackToHome = () => {
    handleLogout();
  };

  const handleProfileClick = (profileId: string, source: "home" | "mailbox" = "home") => {
    if (!isSignedUp) {
      setShowLoginModal(true);
      return;
    }
    setSelectedProfileId(profileId);
    setProfileSource(source);
    setCurrentView("profileDetail");
  };

  const handleBackFromProfileDetail = () => {
    const previousView = selectedProfileId ? profileSource : "home";
    setCurrentView(previousView);
    setSelectedProfileId(null);
  };

  const handleMatchRequest = (profileData: {
    profileId: string;
    nickname: string;
    age: number;
    location: string;
    photo: string;
    sentence: string;
  }) => {
    const alreadySent = sentMatchRequests.find(req => req.profileId === profileData.profileId);

    if (alreadySent) {
      // Already sent - do nothing here, handled in ProfileDetailViewWithInteraction
      return;
    }

    setSentMatchRequests(prev => [
      { ...profileData, timestamp: new Date() },
      ...prev
    ]);
  };

  const handleCancelMatchRequest = (profileId: string) => {
    setSentMatchRequests(prev => prev.filter(req => req.profileId !== profileId));
  };

  const handleTabChange = (tab: "signup" | "home" | "mailbox" | "profile" | "profileDetail") => {
    if (!isSignedUp && tab !== "home") {
      setShowLoginModal(true);
      return;
    }
    setCurrentView(tab);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setHasProfile(false);
    setIsSignedUp(false);
    setCurrentView("home");
  };

  const handleAcceptMatch = (requestId: string) => {
    setReceivedMatchRequests(prev => prev.filter(req => req.id !== requestId));
    setMailboxActiveTab("matched");
  };

  const handleRejectMatch = (requestId: string) => {
    setReceivedMatchRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleLoginSuccess = () => {
    // This might be called if we were using the old modal logic, 
    // but with Kakao redirect, the page reloads. 
    // However, if we add other login methods later, this is useful.
    // For now, just close modal.
    setShowLoginModal(false);
  };

  const handleSignUpClick = () => {
    // In the new flow, "Sign Up" is basically "Login with Kakao" -> "No Profile" -> "SignUpView"
    // But if the modal has a "Sign Up" button, it should probably just trigger the same Kakao login
    // or close modal and show instructions?
    // The updated LoginModal only has Kakao Login, so this might not be clicked.
    setShowLoginModal(false);
  };

  // Placeholder functions for HomeRecruitingView compatibility
  const handleShowLoginModal = () => setShowLoginModal(true);
  const handleRegister = () => setIsRegistered(true);
  const handleCancelRegister = () => setIsRegistered(false);


  if (isLoading) {
    return <div className="min-h-screen bg-[#FCFCFA] flex items-center justify-center">Loading...</div>;
  }

  // 1. Logged In but No Profile -> Sign Up View
  if (session && !hasProfile) {
    return <SignUpView onComplete={handleSignUpComplete} onBack={handleBackToHome} />;
  }

  // 2. Default -> Main App (Home)
  // If not logged in, isSignedUp is false, so Home view handles it.
  return (
    <div className="min-h-screen bg-[#FCFCFA] flex justify-center selection:bg-[#D4AF37]/20">
      {/* Dev Tools - Toggle Recruiting/Dating Phase */}
      <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-[#1A3C34]/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-sans text-[#1A3C34]/60">페이즈:</span>
          <button
            onClick={() => setIsDatingPhase(!isDatingPhase)}
            className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-all ${isDatingPhase
              ? "bg-[#D4AF37] text-white"
              : "bg-[#1A3C34] text-white"
              }`}
          >
            {isDatingPhase ? "소개팅" : "모집"}
          </button>
        </div>
      </div>

      {currentView === "home" && (
        <>
          {isDatingPhase ? (
            <HomeDatingView
              isSignedUp={isSignedUp}
              onShowLoginModal={handleShowLoginModal}
              onProfileClick={handleProfileClick}
            />
          ) : (
            <HomeRecruitingView
              isSignedUp={isSignedUp}
              onShowLoginModal={handleShowLoginModal}
              isRegistered={isRegistered}
              onRegister={handleRegister}
              onCancelRegister={handleCancelRegister}
            />
          )}
          <BottomNav activeTab={currentView} onTabChange={handleTabChange} />
        </>
      )}

      {isSignedUp && (
        <>
          {currentView === "mailbox" && (
            <>
              <MailboxView
                sentMatchRequests={sentMatchRequests}
                receivedMatchRequests={receivedMatchRequests}
                onProfileClick={handleProfileClick}
                activeTab={mailboxActiveTab}
                onTabChange={(tab) => setMailboxActiveTab(tab as "matched" | "sent" | "messages")}
                onAcceptMatch={handleAcceptMatch}
                onRejectMatch={handleRejectMatch}
              />
              <BottomNav activeTab={currentView} onTabChange={handleTabChange} />
            </>
          )}

          {/* Keep MailboxView mounted when showing profile detail from mailbox */}
          {currentView === "profileDetail" && profileSource === "mailbox" && (
            <>
              <MailboxView
                sentMatchRequests={sentMatchRequests}
                receivedMatchRequests={receivedMatchRequests}
                onProfileClick={handleProfileClick}
                activeTab={mailboxActiveTab}
                onTabChange={(tab) => setMailboxActiveTab(tab as "matched" | "sent" | "messages")}
                onAcceptMatch={handleAcceptMatch}
                onRejectMatch={handleRejectMatch}
              />
              <BottomNav activeTab="mailbox" onTabChange={handleTabChange} />
            </>
          )}

          {currentView === "profile" && (
            <>
              <MyProfileView onLogout={handleLogout} />
              <BottomNav activeTab={currentView} onTabChange={handleTabChange} />
            </>
          )}

          {currentView === "profileDetail" && selectedProfileId && (
            <div className={profileSource === "mailbox" ? "fixed inset-0 z-[100] bg-[#FCFCFA] flex justify-center" : ""}>
              <ProfileDetailViewWithInteraction
                profileId={selectedProfileId}
                onBack={handleBackFromProfileDetail}
                onMatchRequest={handleMatchRequest}
                onCancelMatchRequest={handleCancelMatchRequest}
                sentMatchRequests={sentMatchRequests}
                disableMatching={profileSource === "mailbox"}
              />
            </div>
          )}
        </>
      )}

      <Toaster position="top-center" />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignUpClick={handleSignUpClick}
      />
    </div>
  );
}