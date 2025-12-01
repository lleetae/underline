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
import { Toaster, toast } from "sonner";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { CancelRecruitmentModal } from "./CancelRecruitmentModal";
import { BatchUtils } from "../utils/BatchUtils";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false); // User is active in the CURRENT batch (for Dating View)
  const [isApplied, setIsApplied] = useState(false); // User has applied for the TARGET batch (for Button Status)
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [currentView, setCurrentView] = useState<"signup" | "home" | "mailbox" | "profile" | "profileDetail" | "notifications">("home");
  const [isDatingPhase, setIsDatingPhase] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProfilePenalized, setSelectedProfilePenalized] = useState(false);
  const [selectedProfileWithdrawn, setSelectedProfileWithdrawn] = useState(false);
  const [selectedProfileKakaoId, setSelectedProfileKakaoId] = useState<string | null>(null); // New state // New state for penalty
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
  }>>([]);

  const [receivedMatchRequests, setReceivedMatchRequests] = useState<Array<{
    id: string;
    profileId: string;
    nickname: string;
    age: number;
    location: string;
    photo: string;
    letter: string;
    timestamp: Date;
  }>>([]);

  const [matches, setMatches] = useState<Array<{
    id: string;
    profileId: string;
    userImage: string;
    nickname: string;
    age: number;
    location: string;
    bookTitle: string;
    isUnlocked: boolean;
    contactId?: string;
  }>>([]);

  // Check Auth State
  useEffect(() => {
    // 1. Manual Hash Recovery (Fallback for Implicit Flow)
    const handleHash = async () => {
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        try {
          // Parse hash manually
          const hash = window.location.hash.substring(1); // remove #
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (error) {
              toast.error("세션 복구 실패: " + error.message);
            } else if (data.session) {
              setSession(data.session);
              checkProfile(data.session.user.id);
              // Clear hash to prevent loop or clutter
              window.history.replaceState(null, '', window.location.pathname);
              return; // Session established, skip standard getSession
            }
          }
        } catch (e) {
          console.error("Error parsing hash:", e);
        }
      }
    };

    handleHash();

    // 2. Standard Supabase Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        checkProfile(session.user.id);
      } else {
        // Only set loading false if we didn't just manually set session
        // But since handleHash is async, we might have a race. 
        // Ideally we wait, but for now let's rely on the state update.
        if (!window.location.hash.includes('access_token')) {
          setIsSignedUp(false);
          setIsLoading(false);
        }
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
        setIsParticipant(false);
        setIsApplied(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime Subscription for Match Requests
  useEffect(() => {
    if (!session?.user?.id) return;

    console.log("Setting up realtime subscription for user:", session.user.id);

    const channel = supabase
      .channel('match_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_requests'
        },
        (payload) => {
          console.log('Realtime match request update received:', payload);
          // Refresh profile data when any change happens to match_requests
          // In a production app with RLS, we would only receive relevant events.
          // Even without RLS on realtime, checking profile is safe as it fetches fresh data.
          checkProfile(session.user.id);
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [session]);

  const checkProfile = async (userId: string) => {
    console.log("checkProfile called with:", userId);
    try {
      console.log("Fetching member profile...");
      const { data, error: _error } = await supabase
        .from('member')
        .select('id')
        .eq('auth_id', userId)
        .single();

      console.log("Member profile result:", data, _error);

      if (data) {
        setHasProfile(true);
        setIsSignedUp(true);

        // Check application status
        console.log("Checking application status...");

        // 1. Check if user is a PARTICIPANT in the CURRENT batch (for Dating View access)
        const currentBatchDate = BatchUtils.getCurrentBatchStartDate();
        const { start: currentStart, end: currentEnd } = BatchUtils.getBatchApplicationRange(currentBatchDate);

        const { data: participantData } = await supabase
          .from('dating_applications')
          .select('status')
          .eq('member_id', data.id)
          .gte('created_at', currentStart.toISOString())
          .lte('created_at', currentEnd.toISOString())
          .eq('status', 'active')
          .maybeSingle();

        if (participantData) {
          setIsParticipant(true);
        } else {
          setIsParticipant(false);
        }

        // 2. Check if user has APPLIED for the TARGET batch (for Button Status in Recruiting View)
        const targetBatchDate = BatchUtils.getTargetBatchStartDate();
        // If target is same as current (Sun-Thu), we check the same range.
        // If target is next week (Fri-Sat), we need the range for NEXT batch.
        const { start: targetStart, end: targetEnd } = BatchUtils.getBatchApplicationRange(targetBatchDate);

        const { data: applicationData } = await supabase
          .from('dating_applications')
          .select('status')
          .eq('member_id', data.id)
          .gte('created_at', targetStart.toISOString())
          .lte('created_at', targetEnd.toISOString())
          .neq('status', 'cancelled') // Check for any non-cancelled status
          .maybeSingle();

        if (applicationData) {
          setIsApplied(true);
        } else {
          setIsApplied(false);
        }

        // 3. Get Current Interaction Cycle Start Date (for Mailbox Filtering)
        const cycleStartDate = BatchUtils.getCurrentInteractionCycleStart();

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
              photos,
              auth_id
            )
          `)
          .eq('receiver_id', data.id)
          .eq('status', 'pending')
          .gte('created_at', cycleStartDate.toISOString()) // Filter by cycle
          .order('created_at', { ascending: false });

        if (!requestsError && receivedRequests) {
          const formattedRequests = receivedRequests
            .filter((req: any) => req.sender.auth_id !== null) // Filter out withdrawn users
            .map((req: any) => {
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
                timestamp: new Date(req.created_at),
                isBlurred: true // Received requests are blurred
              };
            });
          setReceivedMatchRequests(formattedRequests);
        }

        // Fetch sent match requests
        const { data: sentRequests, error: sentRequestsError } = await supabase
          .from('match_requests')
          .select(`
            id,
            receiver_id,
            letter,
            created_at,
            receiver:member!receiver_id (
              id,
              nickname,
              age,
              birth_date,
              location,
              photo_url,
              photos,
              auth_id
            )
          `)
          .eq('sender_id', data.id)
          .eq('status', 'pending')
          .gte('created_at', cycleStartDate.toISOString()) // Filter by cycle
          .order('created_at', { ascending: false });

        if (!sentRequestsError && sentRequests) {
          const formattedSentRequests = sentRequests
            .filter((req: any) => req.receiver.auth_id !== null) // Filter out withdrawn users
            .map((req: any) => {
              const photos = req.receiver.photos && req.receiver.photos.length > 0
                ? req.receiver.photos
                : (req.receiver.photo_url ? [req.receiver.photo_url] : []);

              const age = req.receiver.age || (req.receiver.birth_date
                ? new Date().getFullYear() - parseInt(req.receiver.birth_date.substring(0, 4))
                : 0);

              return {
                profileId: req.receiver.id.toString(),
                nickname: req.receiver.nickname,
                age: age,
                location: req.receiver.location,
                photo: photos[0] || "",
                letter: req.letter,
                timestamp: new Date(req.created_at),
                isBlurred: true // Sent requests are blurred
              };
            });
          setSentMatchRequests(formattedSentRequests);
        }

        // Fetch matches (accepted requests)
        console.log("Fetching matches...");
        const { data: matchesData, error: matchesError } = await supabase
          .from('match_requests')
          .select(`
            id,
            sender_id,
            receiver_id,
            status,
            letter,
            created_at,
            sender_kakao_id,
            receiver_kakao_id,
            sender:member!sender_id (id, nickname, age, birth_date, location, photo_url, photos, auth_id),
            receiver:member!receiver_id (id, nickname, age, birth_date, location, photo_url, photos, auth_id)
          `)
          .or(`sender_id.eq.${data.id},receiver_id.eq.${data.id}`)
          .eq('status', 'accepted')
          .gte('created_at', cycleStartDate.toISOString()) // Filter by cycle
          .order('created_at', { ascending: false });

        console.log("Matches fetch result:", matchesData, matchesError);

        if (!matchesError && matchesData) {
          const formattedMatches = matchesData.map((match: any) => {
            const isSender = match.sender_id === data.id;
            const partner = isSender ? match.receiver : match.sender;
            const isWithdrawn = partner.auth_id === null;
            const partnerKakaoId = isSender ? match.receiver_kakao_id : match.sender_kakao_id;

            // Helper to get original photo URL
            const getOriginalPhotoUrl = (url: string) => {
              if (!url) return "";
              if (url.includes("profile-photos-blurred")) {
                return url.replace("profile-photos-blurred", "profile-photos-original").replace("blurred_", "");
              }
              return url;
            };

            // Handle photos
            let photos = partner.photos && partner.photos.length > 0
              ? partner.photos
              : (partner.photo_url ? [partner.photo_url] : []);

            // Transform to original URLs for matches
            photos = photos.map((p: string) => getOriginalPhotoUrl(p));

            // Handle age
            const age = partner.age || (partner.birth_date
              ? new Date().getFullYear() - parseInt(partner.birth_date.substring(0, 4))
              : 0);

            // Helper for location
            const getLocationText = (location: string) => {
              const locationMap: { [key: string]: string } = {
                seoul: "서울", busan: "부산", incheon: "인천", daegu: "대구",
                daejeon: "대전", gwangju: "광주", other: "기타"
              };
              return locationMap[location] || location;
            };

            return {
              id: match.id,
              profileId: partner.id.toString(),
              userImage: photos[0] || "",
              nickname: isWithdrawn ? "알수없음 (탈퇴)" : partner.nickname,
              age: age,
              location: getLocationText(partner.location),
              bookTitle: match.letter ? (match.letter.length > 20 ? match.letter.substring(0, 20) + "..." : match.letter) : "매칭된 책", // Use letter as fallback
              isUnlocked: false, // Default to locked for now
              contactId: "kakao_id_placeholder", // Placeholder
              isBlurred: false, // Matched profiles are NOT blurred
              isWithdrawn: isWithdrawn, // Add withdrawn flag
              partnerKakaoId: partnerKakaoId // Add snapshot ID
            };
          });
          setMatches(formattedMatches);
        }

      } else {
        console.log("No profile found");
        setHasProfile(false);
        setIsSignedUp(false);
        setIsParticipant(false);
        setIsApplied(false);
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



  const handleProfileClick = (profileId: string, source: "home" | "mailbox" = "home", metadata?: { isPenalized?: boolean; isWithdrawn?: boolean; partnerKakaoId?: string }) => {
    if (!isSignedUp) {
      setShowLoginModal(true);
      return;
    }
    setSelectedProfileId(profileId);
    setProfileSource(source);
    setSelectedProfilePenalized(metadata?.isPenalized || false);
    setSelectedProfileWithdrawn(metadata?.isWithdrawn || false);
    setSelectedProfileKakaoId(metadata?.partnerKakaoId || null); // Set Kakao ID
    setCurrentView("profileDetail");
  };

  const handleBackFromProfileDetail = () => {
    const previousView = selectedProfileId ? profileSource : "home";
    setCurrentView(previousView);
    setSelectedProfileId(null);
    setSelectedProfileWithdrawn(false);
    setSelectedProfileKakaoId(null); // Reset
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
    setIsParticipant(false);
    setIsApplied(false);
    setCurrentView("home");
  };

  const handleAcceptMatch = async (requestId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/match/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ requestId })
      });

      if (!response.ok) {
        throw new Error('Failed to accept match');
      }

      const { match: updatedMatch } = await response.json();

      // Send Notification to the sender
      try {
        if (session && updatedMatch) {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              type: 'match_accepted',
              targetMemberId: updatedMatch.sender_id, // Notify the sender
              matchId: updatedMatch.id
            })
          });
        }
      } catch (e) {
        console.error("Error sending notification:", e);
      }

      // Update local state
      setReceivedMatchRequests(prev => prev.filter(req => req.id !== requestId));

      // Refresh matches
      checkProfile(session.user.id);

      toast.success("매칭이 성사되었습니다!");
    } catch (error) {
      console.error("Error accepting match:", error);
      toast.error("매칭 수락 중 오류가 발생했습니다.");
    }
  };

  const handleRejectMatch = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('match_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success("매칭을 거절했습니다");
      setReceivedMatchRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error("Error rejecting match:", error);
      toast.error("매칭 거절에 실패했습니다");
    }
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
  const handleRegister = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get member id
      const { data: member } = await supabase
        .from('member')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!member) return;

      // Check which batch we are applying for
      const targetBatchDate = BatchUtils.getTargetBatchStartDate();
      const isNextWeek = targetBatchDate > BatchUtils.getCurrentBatchStartDate();

      const { error } = await supabase
        .from('dating_applications')
        .upsert({
          member_id: member.id,
          status: 'active',
          created_at: new Date().toISOString() // This timestamp places it in the correct batch range
        }, { onConflict: 'member_id' }); // Note: onConflict might need adjustment if we want multiple rows per user. 
      // BUT, since we use created_at to filter, and upsert updates the existing row...
      // Wait, if we upsert on member_id, we overwrite the previous application.
      // This effectively "moves" the application to the new batch if we just update created_at.
      // If we want to keep history, we should NOT use member_id as unique constraint for the table, 
      // OR we need to accept that we only keep the LATEST application.
      // Given the requirement "Reset: Sunday (initialize data)", keeping history might be good but 
      // if the table has a unique constraint on member_id, we can't insert a new row.
      // Let's assume for now we just update the timestamp, which effectively "renews" the application for the new batch.
      // If the user applies again, the created_at updates, moving them to the new batch window.

      if (error) throw error;

      setIsApplied(true);

      // If we are in REGISTRATION phase, applying now also makes us a participant for the current (upcoming) batch immediately?
      // Actually, if it's Sun-Thu (Registration), the "Current Batch" IS the one we are applying for.
      // So we should also set isParticipant to true so they can see the "Application Completed" state 
      // OR if the design is to show Recruiting View until Friday, then isParticipant should remain false?
      // Wait, if I apply on Monday, I am "Registered" for the batch starting THIS Sunday.
      // But the "Dating View" only activates on Friday.
      // So isParticipant should track if I have a valid application for the ACTIVE matching batch.
      // Since matching is only active Fri-Sat, isParticipant will only be relevant then.

      // However, for the UI logic:
      // BatchUtils.getCurrentSystemState() === 'MATCHING' && isParticipant

      // If I apply on Monday (Registration Phase), SystemState is REGISTRATION.
      // So even if isParticipant is true, I won't see Dating View.
      // So it's safe to set isParticipant = true if we are applying for the current batch.

      if (!isNextWeek) {
        setIsParticipant(true);
      }

      if (isNextWeek) {
        toast.success("다음 주 소개팅 신청이 완료되었습니다!");
      } else {
        toast.success("이번 주 소개팅 신청이 완료되었습니다!");
      }

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

      setIsApplied(false);
      if (!BatchUtils.getCurrentSystemState().includes('MATCHING')) {
        setIsParticipant(false);
      }
      setShowCancelModal(false);
      toast.success("신청이 취소되었습니다");
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
  // If not logged in, isSignedUp is false, so Home view handles it.
  return (
    <div className="min-h-screen bg-[#FCFCFA] flex justify-center selection:bg-[var(--primary)]/20">
      {/* Dev Tools - Toggle Recruiting/Dating Phase + Test Notifications */}
      <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-[var(--foreground)]/20 max-w-xs">
        {/* Phase Toggle */}
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

        {/* Notification Tests */}
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
          {/* 
            Logic Update:
            1. If System is in MATCHING phase (Fri-Sat):
               - If User is Registered for CURRENT batch -> Show Dating View
               - Else -> Show Recruiting View (for NEXT batch)
            2. If System is in REGISTRATION phase (Sun-Thu):
               - Show Recruiting View (for CURRENT batch)
            
            DEBUG OVERRIDE: isDatingPhase toggle forces Dating View
          */}
          {(BatchUtils.getCurrentSystemState() === 'MATCHING' || isDatingPhase) && (isParticipant || isDatingPhase) ? (
            <HomeDatingView
              isSignedUp={isSignedUp}
              onProfileClick={handleProfileClick}
              onShowNotifications={handleShowNotifications}
            />
          ) : (
            <HomeRecruitingView
              isSignedUp={isSignedUp}
              onShowLoginModal={handleShowLoginModal}
              isRegistered={isApplied} // Pass isApplied to control the button state
              onRegister={handleRegister}
              onCancelRegister={handleCancelRegister}
              onShowNotifications={handleShowNotifications}
            />
          )}
          <BottomNav activeTab={currentView} onTabChange={handleTabChange} />

          <CancelRecruitmentModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            onConfirm={confirmCancelRegister}
          />

          <CancelRecruitmentModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            onConfirm={confirmCancelRegister}
          />
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
                matches={matches}
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
                matches={matches}
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
                isMatched={matches.some(m => m.profileId === selectedProfileId)} // Check if matched
                disableMatching={profileSource === "mailbox" || selectedProfilePenalized || selectedProfileWithdrawn}
                isWithdrawn={selectedProfileWithdrawn}
                partnerKakaoId={selectedProfileKakaoId} // Pass Kakao ID
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