"use client";

import React, { useState, useEffect } from "react";
import { ProfileDetailViewWithInteraction } from "./ProfileDetailViewWithInteraction";
import { MailboxView } from "./MailboxView";
import { MyProfileView } from "./MyProfileView";
import { SignUpView } from "./SignUpView";
import { HomeRecruitingView } from "./HomeRecruitingView";
import { HomeDatingView } from "./HomeDatingView";
import { NotificationsView } from "./NotificationsView";
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

  const [currentView, setCurrentView] = useState<"signup" | "home" | "mailbox" | "profile" | "profileDetail" | "notifications">("home");
  const [isDatingPhase, setIsDatingPhase] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileSource, setProfileSource] = useState<"home" | "mailbox">("home");
  const [mailboxActiveTab, setMailboxActiveTab] = useState<"matched" | "sent" | "received" | "messages">("matched");
  const [sentMatchRequests, setSentMatchRequests] = useState<Array<{
    profileId: string;
    nickname: string;
    age: number;
    location: string;
    photo: string;
    letter: string;
    timestamp: Date;
  }>>([
    {
      profileId: "profile1",
      nickname: "책읽는여름",
      age: 28,
      location: "서울 성동구",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      letter: "안녕하세요. 프로필을 보다가 '참을 수 없는 존재의 가벼움'을 좋아하신다는 점이 인상 깊어서 매칭 신청을 보냅니다. 저도 그 책을 읽고 많은 생각을 했거든요. 특히 '가벼움과 무거움'에 대한 주제로 이야기를 나눠보고 싶습니다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      profileId: "profile2",
      nickname: "산책하는사람",
      age: 30,
      location: "서울 강남구",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      letter: "데미안을 읽으셨군요! 저에게도 인생 책 중 하나입니다. '새는 알에서 나오려고 투쟁한다'는 구절을 가장 좋아해요. 혹시 어떤 구절을 가장 좋아하시나요? 책 취향이 비슷해 보여서 꼭 한번 대화 나눠보고 싶습니다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      profileId: "37",
      nickname: "소설가지망생",
      age: 27,
      location: "서울 마포구",
      photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
      letter: "안녕하세요! 에리히 프롬의 '사랑의 기술'을 읽으신 걸 보고 반가워서 연락드립니다. 사랑에 대한 깊이 있는 고찰을 좋아하시는 것 같아요. 저도 최근에 다시 읽고 있는데, 함께 독서 모임이나 이야기를 나누면 좋을 것 같아 신청합니다.",
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
    letter: string;
    timestamp: Date;
  }>>([
    {
      id: "received1",
      profileId: "38",
      nickname: "철학하는여자",
      age: 29,
      location: "서울 용산구",
      photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      letter: "안녕하세요~ 프로필에 적힌 책 취향이 저랑 너무 비슷해서 놀랐어요! 저도 주말마다 북카페 찾아다니는 걸 좋아하는데, 혹시 추천해주실 만한 곳이 있나요? 같이 책 이야기 나누고 싶어요.",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "received2",
      profileId: "39",
      nickname: "문학소녀",
      age: 26,
      location: "서울 종로구",
      photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
      letter: "반갑습니다. '코스모스'를 인생 책으로 꼽으셨더라고요. 저도 우주와 과학에 관심이 많습니다. '우리는 모두 별의 먼지'라는 말을 참 좋아하는데, 이런 주제로 깊은 대화를 나눠보고 싶어서 신청합니다.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: "received3",
      profileId: "36",
      nickname: "심리학도",
      age: 31,
      location: "서울 서초구",
      photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
      letter: "여행 에세이를 좋아하시는군요! '진정한 여행은 새로운 눈을 갖는 것'이라는 말에 깊이 공감합니다. 저도 여행 다니며 글 쓰는 걸 좋아해요. 서로의 여행 경험과 책 이야기를 공유하면 즐거울 것 같습니다.",
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
        setIsRegistered(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (userId: string) => {
    console.log("checkProfile called with:", userId);
    try {
      console.log("Fetching member profile...");
      const { data, error: _error } = await supabase
        .from('member')
        .select('id')
        .eq('auth_id', userId) // Query by auth_id (UUID) instead of id (BIGINT)
        .single();

      console.log("Member profile result:", data, _error);

      if (data) {
        setHasProfile(true);
        setIsSignedUp(true);

        // Check application status
        console.log("Checking application status...");
        const { data: applicationData, error: appError } = await supabase
          .from('dating_applications')
          .select('status')
          .eq('member_id', data.id)
          .single();

        console.log("Application status result:", applicationData, appError);

        if (applicationData && applicationData.status === 'active') {
          setIsRegistered(true);
        } else {
          setIsRegistered(false);
        }

        // Fetch received match requests
        const { data: receivedRequests, error: requestsError } = await supabase
          .from('match_requests')
          .select(`
            id,
            sender_id,
            letter,
            created_at,
            sender:member!sender_id (
              id,
              nickname,
              age,
              birth_date,
              location,
              photo_url,
              photos
            )
          `)
          .eq('receiver_id', data.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!requestsError && receivedRequests) {
          const formattedRequests = receivedRequests.map((req: any) => {
            // Handle photos: check photos array first, then photo_url
            const photos = req.sender.photos && req.sender.photos.length > 0
              ? req.sender.photos
              : (req.sender.photo_url ? [req.sender.photo_url] : []);

            // Handle age: use age if available, otherwise calculate from birth_date
            const age = req.sender.age || (req.sender.birth_date
              ? new Date().getFullYear() - parseInt(req.sender.birth_date.substring(0, 4))
              : 0);

            return {
              id: req.id,
              profileId: req.sender.id.toString(),
              nickname: req.sender.nickname,
              age: age,
              location: req.sender.location,
              photo: photos[0] || "",
              letter: req.letter,
              timestamp: new Date(req.created_at)
            };
          });
          setReceivedMatchRequests(formattedRequests);
        }
      } else {
        console.log("No profile found");
        setHasProfile(false);
        setIsSignedUp(false);
        setIsRegistered(false);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    } finally {
      console.log("Setting isLoading to false");
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
    letter: string;
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
    setIsRegistered(false);
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

  const handleShowNotifications = () => {
    if (!isSignedUp) {
      setShowLoginModal(true);
      return;
    }
    setCurrentView("notifications");
  };

  const handleNotificationNavigateToMatch = (_matchId: string, notificationType: 'match_request' | 'match_accepted' | 'contact_revealed') => {
    // Navigate to mailbox with appropriate tab
    setCurrentView("mailbox");

    // Match request -> 받음 (received) tab
    // Match accepted, Contact revealed -> 매칭 됨 (matched) tab
    if (notificationType === 'match_request') {
      setMailboxActiveTab("received"); // Note: "sent" tab shows received requests in Korean UI
    } else {
      setMailboxActiveTab("matched");
    }
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
      {/* Dev Tools - Toggle Recruiting/Dating Phase + Test Notifications */}
      <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-[#1A3C34]/20 max-w-xs">
        {/* Phase Toggle */}
        <div className="flex items-center gap-2 mb-3">
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

        {/* Notification Tests */}
        {isSignedUp && (
          <div className="border-t border-[#1A3C34]/10 pt-3">
            <div className="text-xs font-sans text-[#1A3C34]/60 mb-2">알림 테스트:</div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const response = await fetch('/api/test/create-notification', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                      },
                      body: JSON.stringify({ type: 'match_request' })
                    });
                    if (response.ok) alert('매칭 신청 알림 생성!');
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-2 py-1 bg-pink-500 text-white rounded text-xs hover:bg-pink-600 transition"
              >
                💌 매칭 신청
              </button>
              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const response = await fetch('/api/test/create-notification', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                      },
                      body: JSON.stringify({ type: 'match_accepted' })
                    });
                    if (response.ok) alert('매칭 수락 알림 생성!');
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition"
              >
                ✅ 매칭 수락
              </button>
              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const response = await fetch('/api/test/create-notification', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                      },
                      body: JSON.stringify({ type: 'contact_revealed' })
                    });
                    if (response.ok) alert('연락처 공개 알림 생성!');
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
              >
                📱 연락처 공개
              </button>
            </div>
          </div>
        )}
      </div>

      {currentView === "home" && (
        <>
          {isDatingPhase ? (
            <HomeDatingView
              isSignedUp={isSignedUp}
              onProfileClick={handleProfileClick}
              onShowNotifications={handleShowNotifications}
            />
          ) : (
            <HomeRecruitingView
              isSignedUp={isSignedUp}
              onShowLoginModal={handleShowLoginModal}
              isRegistered={isRegistered}
              onRegister={handleRegister}
              onCancelRegister={handleCancelRegister}
              onShowNotifications={handleShowNotifications}
            />
          )}
          <BottomNav activeTab={currentView} onTabChange={handleTabChange} />
        </>
      )}

      {currentView === "notifications" && (
        <NotificationsView
          onBack={() => setCurrentView("home")}
          onNavigateToMatch={handleNotificationNavigateToMatch}
        />
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
                onShowNotifications={handleShowNotifications}
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
                onShowNotifications={handleShowNotifications}
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