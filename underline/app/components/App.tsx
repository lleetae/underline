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
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { CancelRecruitmentModal } from "./CancelRecruitmentModal";
import { BatchUtils } from "../utils/BatchUtils";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useMatches } from "../hooks/useMatches";

export default function App() {
  // Custom Hooks
  const { session, isLoading: authLoading } = useAuth();
  const {
    hasProfile,
    isSignedUp,
    isParticipant,
    isApplied,
    profileId,
    isLoading: profileLoading,
    checkProfile,
    setIsApplied: setLocalIsApplied,
    setIsParticipant: setLocalIsParticipant,
    setHasProfile: setLocalHasProfile,
    setIsSignedUp: setLocalIsSignedUp
  } = useProfile(session?.user?.id);

  const {
    sentMatchRequests,
    receivedMatchRequests,
    matches,
    isLoading: matchesLoading,
    refreshMatches,
    acceptMatch,
    rejectMatch
  } = useMatches(session?.user?.id, profileId);

  // Combined Loading State
  // UI State
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Combined Loading State
  const isLoading = (authLoading || profileLoading || matchesLoading) && !loadingTimeout;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentView, setCurrentView] = useState<"signup" | "home" | "mailbox" | "profile" | "profileDetail" | "notifications">("home");
  const [isDatingPhase, setIsDatingPhase] = useState(false);

  // Profile Detail State
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProfileWithdrawn, setSelectedProfileWithdrawn] = useState(false);
  const [selectedProfileKakaoId, setSelectedProfileKakaoId] = useState<string | null>(null);
  const [selectedProfileIsUnlocked, setSelectedProfileIsUnlocked] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [profileSource, setProfileSource] = useState<"home" | "mailbox">("home");

  // Mailbox State
  const [mailboxActiveTab, setMailboxActiveTab] = useState<"matched" | "sent" | "received" | "messages">("matched");

  // Handle Payment Redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentSuccess = params.get('payment_success');
      const paymentError = params.get('payment_error');

      if (paymentSuccess) {
        setCurrentView("mailbox");
        setMailboxActiveTab("matched");
        toast.success("결제가 완료되었습니다! 연락처가 공개되었습니다.");
        window.history.replaceState({}, '', '/');
      } else if (paymentError) {
        setCurrentView("mailbox");
        setMailboxActiveTab("matched");
        toast.error(`결제 실패: ${decodeURIComponent(paymentError)}`);
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  const handleSignUpComplete = () => {
    setLocalHasProfile(true);
    setLocalIsSignedUp(true);
    setCurrentView("home");
    checkProfile();
  };

  const handleBackToHome = () => {
    handleLogout();
  };

  const handleProfileClick = (profileId: string, source: "home" | "mailbox" = "home", metadata?: { isPenalized?: boolean; isWithdrawn?: boolean; partnerKakaoId?: string; isUnlocked?: boolean; matchId?: string }) => {
    if (!isSignedUp) {
      setShowLoginModal(true);
      return;
    }
    setSelectedProfileId(profileId);
    setProfileSource(source);
    setSelectedProfileWithdrawn(metadata?.isWithdrawn || false);
    setSelectedProfileKakaoId(metadata?.partnerKakaoId || null);
    setSelectedProfileIsUnlocked(metadata?.isUnlocked || false);
    setSelectedMatchId(metadata?.matchId || null);
    setCurrentView("profileDetail");
  };

  const handleBackFromProfileDetail = () => {
    const previousView = selectedProfileId ? profileSource : "home";
    setCurrentView(previousView);
    setSelectedProfileId(null);
    setSelectedProfileWithdrawn(false);
    setSelectedProfileKakaoId(null);
    setSelectedProfileIsUnlocked(false);
    setSelectedMatchId(null);
  };

  const handleMatchRequest = (_profileData: {
    profileId: string;
    nickname: string;
    age: number;
    location: string;
    photo: string;
    letter: string;
  }) => {
    refreshMatches();
  };

  const handleTabChange = (tab: "signup" | "home" | "mailbox" | "profile" | "profileDetail") => {
    if (!isSignedUp && tab !== "home") {
      setShowLoginModal(true);
      return;
    }
    setCurrentView(tab);
  };

  // Safety Timeout for Loading State
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timed out, forcing render.");
        setLoadingTimeout(true);
        toast.error("데이터 로딩이 지연되어 강제로 화면을 표시합니다.");
      }
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView("home");
  };

  const handleAcceptMatch = async (requestId: string) => {
    try {
      await acceptMatch(requestId);
      toast.success("매칭이 성사되었습니다!");
    } catch (error) {
      toast.error("매칭 수락 중 오류가 발생했습니다.");
    }
  };

  const handleRejectMatch = async (requestId: string) => {
    try {
      await rejectMatch(requestId);
      toast.success("매칭을 거절했습니다");
    } catch (error) {
      toast.error("매칭 거절에 실패했습니다");
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
  };

  const handleSignUpClick = () => {
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
    setCurrentView("mailbox");
    if (notificationType === 'match_request') {
      setMailboxActiveTab("received");
    } else {
      setMailboxActiveTab("matched");
    }
  };

  const handleShowLoginModal = () => setShowLoginModal(true);

  const handleRegister = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('member')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!member) return;

      const targetBatchDate = BatchUtils.getTargetBatchStartDate();
      const isNextWeek = targetBatchDate > BatchUtils.getCurrentBatchStartDate();

      const { error } = await supabase
        .from('dating_applications')
        .upsert({
          member_id: member.id,
          status: 'active',
          created_at: new Date().toISOString()
        }, { onConflict: 'member_id' });

      if (error) throw error;

      setLocalIsApplied(true);

      if (!isNextWeek) {
        setLocalIsParticipant(true);
      }

      if (isNextWeek) {
        toast.success("다음 주 소개팅 신청이 완료되었습니다!");
      } else {
        toast.success("이번 주 소개팅 신청이 완료되었습니다!");
      }

      checkProfile();

    } catch (error) {
      console.error("Error registering:", error);
      toast.error("신청에 실패했습니다");
    }
  };

  const handleCancelRegister = () => {
    setShowCancelModal(true);
  };

  const confirmCancelRegister = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('member')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!member) return;

      const { error } = await supabase
        .from('dating_applications')
        .update({ status: 'cancelled' })
        .eq('member_id', member.id);

      if (error) throw error;

      setLocalIsApplied(false);
      if (!BatchUtils.getCurrentSystemState().includes('MATCHING')) {
        setLocalIsParticipant(false);
      }
      setShowCancelModal(false);
      toast.success("신청이 취소되었습니다");

      checkProfile();
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("취소에 실패했습니다");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#FCFCFA] flex items-center justify-center">Loading...</div>;
  }

  // 1. Logged In but No Profile -> Sign Up View
  if (session && !hasProfile) {
    return <SignUpView onComplete={handleSignUpComplete} onBack={handleBackToHome} />;
  }

  // 2. Default -> Main App (Home)
  return (
    <div className="min-h-screen bg-[#FCFCFA] flex justify-center selection:bg-[var(--primary)]/20">
      {/* Dev Tools - Toggle Recruiting/Dating Phase + Test Notifications */}
      <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-[var(--foreground)]/20 max-w-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-sans text-[var(--foreground)]/60">페이즈:</span>
          <button
            onClick={() => setIsDatingPhase(!isDatingPhase)}
            className={`px-3 py-1.5 rounded-md text-xs font-sans font-medium transition-all ${isDatingPhase
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--foreground)] text-white"
              }`}
          >
            {isDatingPhase ? "소개팅" : "모집"}
          </button>
        </div>

        {isSignedUp && (
          <div className="border-t border-[var(--foreground)]/10 pt-3">
            <div className="text-xs font-sans text-[var(--foreground)]/60 mb-2">알림 테스트:</div>
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
          {(BatchUtils.getCurrentSystemState().includes('MATCHING') && isParticipant) || isDatingPhase ? (
            <HomeDatingView
              onProfileClick={handleProfileClick}
              onShowNotifications={handleShowNotifications}
              isSignedUp={isSignedUp}
            />
          ) : (
            <HomeRecruitingView
              onRegister={handleRegister}
              onCancelRegister={handleCancelRegister}
              onShowLoginModal={handleShowLoginModal}
              isSignedUp={isSignedUp}
              isRegistered={isApplied}
              onShowNotifications={handleShowNotifications}
            />
          )}
        </>
      )}

      {currentView === "mailbox" && (
        <MailboxView
          activeTab={mailboxActiveTab}
          onTabChange={(tab) => setMailboxActiveTab(tab as "matched" | "sent" | "received" | "messages")}
          onProfileClick={handleProfileClick}
          onAcceptMatch={handleAcceptMatch}
          onRejectMatch={handleRejectMatch}
          sentMatchRequests={sentMatchRequests}
          receivedMatchRequests={receivedMatchRequests}
          matches={matches}
        />
      )}

      {currentView === "profile" && (
        <MyProfileView
          onLogout={handleLogout}
        />
      )}

      {currentView === "profileDetail" && selectedProfileId && (
        <ProfileDetailViewWithInteraction
          profileId={selectedProfileId}
          onBack={handleBackFromProfileDetail}
          onMatchRequest={handleMatchRequest}
          isWithdrawn={selectedProfileWithdrawn}
          partnerKakaoId={selectedProfileKakaoId}
          isUnlocked={selectedProfileIsUnlocked}
          matchId={selectedMatchId}
        />
      )}

      {currentView === "notifications" && (
        <NotificationsView
          onBack={() => setCurrentView("home")}
          onNavigateToMatch={handleNotificationNavigateToMatch}
        />
      )}

      {/* Bottom Navigation */}
      {isSignedUp && currentView !== "signup" && currentView !== "profileDetail" && (
        <BottomNav
          activeTab={currentView as "home" | "mailbox" | "profile"} // Cast to match prop type
          onTabChange={(tab) => handleTabChange(tab as any)}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          onSignUpClick={handleSignUpClick}
        />
      )}

      {/* Cancel Recruitment Modal */}
      {showCancelModal && (
        <CancelRecruitmentModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={confirmCancelRegister}
        />
      )}
    </div>
  );
}