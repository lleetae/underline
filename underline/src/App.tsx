import React, { useState } from "react";
import { ProfileDetailView } from "./components/ProfileDetailView";
import { ProfileDetailViewWithInteraction } from "./components/ProfileDetailViewWithInteraction";
import { MailboxView } from "./components/MailboxView";
import { MyProfileView } from "./components/MyProfileView";
import { SignUpView } from "./components/SignUpView";
import { HomeRecruitingView } from "./components/HomeRecruitingView";
import { HomeDatingView } from "./components/HomeDatingView";
import { BottomNav } from "./components/mailbox/BottomNav";
import { LoginModal } from "./components/LoginModal";
import { Toaster } from "sonner@2.0.3";

export default function App() {
  const [currentView, setCurrentView] = useState<"signup" | "home" | "mailbox" | "profile" | "profileDetail">("home");
  const [isSignedUp, setIsSignedUp] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  // Toggle between recruiting phase and dating phase
  const [isDatingPhase, setIsDatingPhase] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileSource, setProfileSource] = useState<"home" | "mailbox">("home"); // Track where profile was clicked from
  const [mailboxActiveTab, setMailboxActiveTab] = useState<"matched" | "sent" | "messages">("received"); // Track mailbox tab state
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
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
    },
    {
      profileId: "profile2",
      nickname: "산책하는사람",
      age: 30,
      location: "서울 강남구",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      sentence: "새는 알에서 나오려고 투쟁한다. 알은 세계다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
    },
    {
      profileId: "profile3",
      nickname: "커피애호가",
      age: 27,
      location: "서울 마포구",
      photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
      sentence: "사랑이란 타인을 통해 자기 자신을 발견하는 과정이다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
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
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45분 전
    },
    {
      id: "received2",
      profileId: "profile5",
      nickname: "밤하늘독서",
      age: 26,
      location: "서울 종로구",
      photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
      sentence: "우리는 모두 별이 되기 위해 어둠 속을 헤매고 있다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3시간 전
    },
    {
      id: "received3",
      profileId: "profile6",
      nickname: "조용한오후",
      age: 31,
      location: "서울 서초구",
      photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
      sentence: "진정한 여행은 새로운 풍경을 보는 것이 아니라 새로운 눈을 갖는 것이다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5시간 전
    },
  ]);

  const handleSignUpComplete = () => {
    setIsSignedUp(true);
    setCurrentView("home");
  };

  const handleBackToHome = () => {
    setCurrentView("home");
  };

  const handleProfileClick = (profileId: string, source: "home" | "mailbox" = "home") => {
    if (!isSignedUp) {
      // If not signed up, show login modal
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
    // Check if already sent to this profile
    const alreadySent = sentMatchRequests.find(req => req.profileId === profileData.profileId);

    if (alreadySent) {
      // Already sent - do nothing here, handled in ProfileDetailViewWithInteraction
      return;
    }

    setSentMatchRequests(prev => [
      {
        ...profileData,
        timestamp: new Date(),
      },
      ...prev
    ]);
  };

  const handleCancelMatchRequest = (profileId: string) => {
    setSentMatchRequests(prev => prev.filter(req => req.profileId !== profileId));
  };

  const handleTabChange = (tab: "signup" | "home" | "mailbox" | "profile" | "profileDetail") => {
    if (!isSignedUp && tab !== "home") {
      // If not signed up and trying to access other tabs, show login modal
      setShowLoginModal(true);
      return;
    }
    setCurrentView(tab);
  };

  const handleLoginSuccess = () => {
    setIsSignedUp(true);
  };

  const handleSignUpClick = () => {
    setShowLoginModal(false);
    setCurrentView("signup");
  };

  const handleLogout = () => {
    setIsSignedUp(false);
    setIsRegistered(false);
    setCurrentView("home");
    setSentMatchRequests([]);
  };

  const handleRegister = () => {
    setIsRegistered(true);
  };

  const handleCancelRegister = () => {
    setIsRegistered(false);
  };

  const handleShowLoginModal = () => {
    setShowLoginModal(true);
  };

  const handleAcceptMatch = (requestId: string) => {
    setReceivedMatchRequests(prev => prev.filter(req => req.id !== requestId));
    // Switch to matched tab after accepting
    setMailboxActiveTab("matched");
  };

  const handleRejectMatch = (requestId: string) => {
    setReceivedMatchRequests(prev => prev.filter(req => req.id !== requestId));
  };

  return (
    <div className="min-h-screen bg-[#FCFCFA] flex justify-center selection:bg-[#D4AF37]/20">

      {currentView === "signup" ? (
        <SignUpView onComplete={handleSignUpComplete} onBack={handleBackToHome} />
      ) : (
        <>
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
                    onTabChange={setMailboxActiveTab}
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
                    onTabChange={setMailboxActiveTab}
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
        </>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignUpClick={handleSignUpClick}
      />

      <Toaster position="top-center" />
    </div>
  );
}