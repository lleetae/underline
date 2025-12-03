"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProfileDetailViewWithInteraction } from "./ProfileDetailViewWithInteraction";
import { MailboxView } from "./MailboxView";
import { MyProfileView } from "./MyProfileView";
import { SignUpView } from "./SignUpView";
import { HomeRecruitingView } from "./HomeRecruitingView";
import { HomeDatingView } from "./HomeDatingView";
import { NotificationsView } from "./NotificationsView";
import { BottomNav } from "./mailbox/BottomNav";
import { LoginModal } from "./LoginModal";
import { CouponBoxView } from "./CouponBoxView";
import { RegionStatsView } from "./RegionStatsView";
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
  const [isSpectator, setIsSpectator] = useState(false); // User is in a FAILED region (Spectator Mode)
  const [isApplied, setIsApplied] = useState(false); // User has applied for the TARGET batch (for Button Status)
  const [showCancelModal, setShowCancelModal] = useState(false);


  const [currentView, setCurrentView] = useState<"signup" | "home" | "mailbox" | "profile" | "profileDetail" | "notifications" | "couponBox" | "regionStats">("home");
  const [isDatingPhase, setIsDatingPhase] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProfilePenalized, setSelectedProfilePenalized] = useState(false);
  const [selectedProfileWithdrawn, setSelectedProfileWithdrawn] = useState(false);
  const [selectedProfileKakaoId, setSelectedProfileKakaoId] = useState<string | null>(null);
  const [selectedProfileIsUnlocked, setSelectedProfileIsUnlocked] = useState(false); // New state
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null); // New state
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

  // Generic View Params State
  const [viewParams, setViewParams] = useState<any>({});

  // Navigation Helper
  // Navigation Helper
  const navigateTo = useCallback((view: typeof currentView, params?: any, options?: { replace?: boolean }) => {
    const state = { view, ...params };

    // Construct URL with query params
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);

    // Add other params to URL if they exist
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, String(value));
      });
    }

    // Special handling for mailbox tab persistence
    if (view === "mailbox" && mailboxActiveTab) {
      // If we are navigating TO mailbox, we might want to persist the current tab or a requested tab
      // But navigateTo doesn't know about mailboxActiveTab state directly if it's not passed in params.
      // We'll rely on params for now.
    }

    if (options?.replace) {
      window.history.replaceState(state, "", url.toString());
    } else {
      window.history.pushState(state, "", url.toString());
    }
    setCurrentView(view);
    setViewParams(params || {});
  }, []);

  // Handle Browser Back/Forward & Initial Load
  useEffect(() => {
    const restoreStateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view") as typeof currentView;

      if (viewParam && ["signup", "home", "mailbox", "profile", "profileDetail", "notifications", "couponBox", "regionStats"].includes(viewParam)) {
        setCurrentView(viewParam);

        // Restore other params
        const otherParams: any = {};
        params.forEach((value, key) => {
          if (key !== "view") {
            otherParams[key] = value;
          }
        });
        setViewParams(otherParams);

        // Ensure history state matches URL (for initial load)
        if (!window.history.state) {
          window.history.replaceState({ view: viewParam, ...otherParams }, "", window.location.href);
        }
      } else {
        // Default to home if no view param
        if (!window.history.state) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set("view", "home");
          window.history.replaceState({ view: "home" }, "", newUrl.toString());
        }
      }
    };

    // Initialize from URL
    restoreStateFromUrl();

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        // Extract params (everything except view)
        const { view, ...params } = event.state;
        setViewParams(params);
      } else {
        // Fallback: Try to restore from URL if state is missing
        restoreStateFromUrl();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Check Auth State
  useEffect(() => {
    console.log("App mounted, starting auth check...");
    // 1. Manual Hash Recovery (Fallback for Implicit Flow)
    const handleHash = async () => {
      console.log("handleHash called. Hash:", window.location.hash);
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        try {
          console.log("Hash contains access_token, parsing...");
          // Parse hash manually
          const hash = window.location.hash.substring(1); // remove #
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            console.log("Access token found in hash, setting session...");
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (error) {
              console.error("Session set error:", error);
              toast.error("세션 복구 실패: " + error.message);
              setIsLoading(false);
            } else if (data.session) {
              console.log("Session set successfully from hash:", data.session.user.id);
              setSession(data.session);
              checkProfile(data.session.user.id);
              // Clear hash to prevent loop or clutter, but preserve view state
              window.history.replaceState({ view: "home" }, '', window.location.pathname);
              return; // Session established, skip standard getSession
            } else {
              console.log("No session data returned after setSession");
              setIsLoading(false);
            }
          } else {
            console.log("No access token found in parsed hash");
            setIsLoading(false);
          }
        } catch (e) {
          console.error("Error parsing hash:", e);
          setIsLoading(false);
        }
      } else {
        console.log("No access_token in hash");
      }
    };

    handleHash();

    // 2. Standard Supabase Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("getSession result:", session ? "Session found" : "No session");
      if (session) {
        setSession(session);
        checkProfile(session.user.id);
      } else {
        // Only set loading false if we didn't just manually set session
        // But since handleHash is async, we might have a race. 
        // Ideally we wait, but for now let's rely on the state update.
        if (!window.location.hash.includes('access_token')) {
          console.log("No session and no hash, setting isLoading false");
          setIsSignedUp(false);
          setIsLoading(false);
        } else {
          console.log("No session but hash exists, waiting for handleHash");
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("onAuthStateChange event:", _event, session ? "Session exists" : "No session");
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
    return () => subscription.unsubscribe();
  }, []);

  // Capture Referral Code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        console.log("Referral code captured:", refCode);
        localStorage.setItem('referrer_id', refCode);
      }
    }
  }, []);

  // Safety Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timed out, forcing render.");
        setIsLoading(false);
        toast.error("로딩이 지연되어 화면을 표시합니다.");
      }
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Handle Payment Redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentSuccess = params.get('payment_success');
      const paymentError = params.get('payment_error');

      if (paymentSuccess || paymentError) {
        // Log the error for debugging
        if (paymentError) {
          console.error("Payment Error from URL:", paymentError);
        }

        // Clean up URL params IMMEDIATELY to prevent persistence
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('payment_success');
        newUrl.searchParams.delete('payment_error');
        newUrl.searchParams.set('view', 'mailbox');
        window.history.replaceState({ view: 'mailbox' }, "", newUrl.toString());

        // Only show toast and update state if signed up (to avoid hydration issues or premature state updates)
        if (isSignedUp) {
          if (paymentSuccess) {
            setMailboxActiveTab("matched");
            toast.success("결제가 완료되었습니다! 연락처가 공개되었습니다.");
            setCurrentView("mailbox");
          } else if (paymentError) {
            setMailboxActiveTab("matched");
            toast.error(`결제 실패: ${decodeURIComponent(paymentError)}`);
            setCurrentView("mailbox");
          }
        }
      }
    }
  }, [isSignedUp]);

  // Reset scroll position on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

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
          // toast.info("매칭 정보가 업데이트되었습니다."); // Debug toast
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

  const fetchMatches = useCallback(async () => {
    console.log("Fetching matches via API...");
    const startTime = performance.now();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const response = await fetch('/api/matches/list', {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Frontend] API Fetch took: ${duration.toFixed(2)}ms`);

      if (response.ok) {
        const { matches: apiMatches, version, debug } = await response.json();
        console.log(`[Frontend] Matches API Success. Version: ${version}, Count: ${apiMatches.length}`);
        if (debug) console.log("[Frontend] Server Timing:", debug);
        setMatches(apiMatches);
        // toast.success(`매칭 목록을 불러왔습니다. (${apiMatches.length}개)`);
      } else {
        console.error("Failed to fetch matches from API", await response.text());
        // toast.error("매칭 목록 불러오기 실패");
      }
    } else {
      console.log("No session for fetchMatches");
    }
  }, []);

  // Realtime Subscription for Notifications
  useEffect(() => {
    if (!session?.user?.id) return;

    console.log("Setting up notification subscription for user:", session.user.id);

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Realtime notification received:', payload);
          const newNotification = payload.new as any;

          if (newNotification.type === 'match_accepted') {
            toast.success("매칭이 성사되었습니다! 연락처가 공개되었습니다.");
            // Optionally refresh matches or notifications count here
            fetchMatches();
          } else if (newNotification.type === 'match_request') {
            toast.info("새로운 매칭 신청이 도착했습니다!");
          } else if (newNotification.type === 'contact_revealed') {
            toast.success("상대방이 결제를 완료하여 연락처가 공개되었습니다!");
            fetchMatches();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchMatches]);

  const checkProfile = async (userId: string) => {
    console.log("checkProfile called with:", userId);
    try {
      console.log("Fetching member profile...");
      const { data, error: _error } = await supabase
        .from('member')
        .select('*')
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
          .in('status', ['active', 'failed']) // Check for both active and failed
          .maybeSingle();

        if (participantData) {
          if (participantData.status === 'active') {
            setIsParticipant(true);
            setIsSpectator(false);
          } else if (participantData.status === 'failed') {
            setIsParticipant(false);
            setIsSpectator(true);
          }
        } else {
          setIsParticipant(false);
          setIsSpectator(false);
        }




        // Check if user has applied for the NEXT cycle
        const targetBatchDate = BatchUtils.getTargetBatchStartDate();
        const { start: targetStart, end: targetEnd } = BatchUtils.getBatchApplicationRange(targetBatchDate);

        const { data: applicationData } = await supabase
          .from('dating_applications')
          .select('status')
          .eq('member_id', data.id)
          .gte('created_at', targetStart.toISOString())
          .lte('created_at', targetEnd.toISOString())
          .neq('status', 'cancelled')
          .maybeSingle();

        if (applicationData) {
          setIsApplied(true);
        } else {
          setIsApplied(false);
        }

        // Get Current Interaction Cycle Start Date (for Mailbox Filtering)
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
              sido,
              sigungu,
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
            .filter((req: any) => req.sender && req.sender.auth_id !== null) // Filter out withdrawn users
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
                location: (req.sender.sido && req.sender.sigungu) ? `${req.sender.sido} ${req.sender.sigungu}` : "알 수 없음",
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
              sido,
              sigungu,
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
                location: (req.receiver.sido && req.receiver.sigungu) ? `${req.receiver.sido} ${req.receiver.sigungu}` : "알 수 없음",
                photo: photos[0] || "",
                letter: req.letter,
                timestamp: new Date(req.created_at),
                isBlurred: true // Sent requests are blurred
              };
            });
          setSentMatchRequests(formattedSentRequests);
        }

        // Fetch matches (accepted requests) via API to bypass RLS issues
        await fetchMatches();

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
    navigateTo("home", { replace: true });
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
    setSelectedProfilePenalized(metadata?.isPenalized || false);
    setSelectedProfileWithdrawn(metadata?.isWithdrawn || false);
    setSelectedProfileKakaoId(metadata?.partnerKakaoId || null);
    setSelectedProfileIsUnlocked(metadata?.isUnlocked || false);
    setSelectedMatchId(metadata?.matchId || null);
    navigateTo("profileDetail");
  };

  const handleBackFromProfileDetail = () => {
    window.history.back();
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

  const handleTabChange = (tab: "signup" | "home" | "mailbox" | "profile" | "profileDetail" | "couponBox") => {
    if (!isSignedUp && tab !== "home") {
      setShowLoginModal(true);
      return;
    }
    navigateTo(tab);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setHasProfile(false);
    setIsSignedUp(false);
    setIsParticipant(false);
    setIsApplied(false);
    navigateTo("home", { replace: true });
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

      await response.json();

      // Notification is now handled server-side in /api/match/accept

      // Update local state
      setReceivedMatchRequests(prev => prev.filter(req => req.id !== requestId));

      // Wait a bit for DB propagation then refresh
      setTimeout(async () => {
        await fetchMatches();
        setMailboxActiveTab("matched");
      }, 500);

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
    navigateTo("notifications");
  };

  const handleNotificationNavigateToMatch = (_matchId: string, notificationType: 'match_request' | 'match_accepted' | 'contact_revealed') => {
    // Navigate to mailbox with appropriate tab
    navigateTo("mailbox");

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
          {(BatchUtils.getCurrentSystemState() === 'MATCHING' || isDatingPhase) && (isParticipant || isDatingPhase || isSpectator) ? (
            <HomeDatingView
              isSignedUp={isSignedUp}
              onProfileClick={handleProfileClick}
              onShowNotifications={handleShowNotifications}
              isSpectator={isSpectator} // Pass isSpectator
              onRegister={handleRegister}
            />
          ) : (
            <HomeRecruitingView
              isSignedUp={isSignedUp}
              onShowLoginModal={handleShowLoginModal}
              isRegistered={isApplied} // Pass isApplied to control the button state
              onRegister={handleRegister}
              onCancelRegister={handleCancelRegister}
              onShowNotifications={handleShowNotifications}
              onNavigate={navigateTo}
            />
          )}
          <BottomNav activeTab={currentView} onTabChange={handleTabChange} />

          <CancelRecruitmentModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            onConfirm={confirmCancelRegister}
          />
        </>
      )}

      {currentView === "notifications" && (
        <NotificationsView
          onBack={() => window.history.back()}
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
                onRefreshMatches={fetchMatches}
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
                onRefreshMatches={fetchMatches}
              />
              <BottomNav activeTab="mailbox" onTabChange={handleTabChange} />
            </>
          )}

          {currentView === "profile" && (
            <>
              <MyProfileView
                onLogout={handleLogout}
                onNavigate={navigateTo}
                selectedBookId={viewParams.bookId}
              />
              <BottomNav activeTab={currentView} onTabChange={handleTabChange} />
            </>
          )}

          {currentView === "couponBox" && (
            <CouponBoxView
              onBack={() => navigateTo("profile")}
            />
          )}

          {currentView === "profileDetail" && selectedProfileId && (
            <div className={profileSource === "mailbox" ? "fixed inset-0 z-[100] bg-[#FCFCFA] flex justify-center" : ""}>
              <ProfileDetailViewWithInteraction
                profileId={selectedProfileId}
                onBack={handleBackFromProfileDetail}
                onNavigate={navigateTo}
                selectedBookId={viewParams.bookId}
                onMatchRequest={handleMatchRequest}
                sentMatchRequests={sentMatchRequests}
                receivedMatchRequests={receivedMatchRequests}
                isMatched={profileSource === "mailbox" && mailboxActiveTab === "matched"}
                disableMatching={profileSource === "mailbox" || selectedProfilePenalized || selectedProfileWithdrawn || isSpectator} // Disable for spectators
                isSpectator={isSpectator} // Pass isSpectator explicitly for Toast logic
                isWithdrawn={selectedProfileWithdrawn}
                partnerKakaoId={selectedProfileKakaoId} // Pass Kakao ID
                isUnlocked={selectedProfileIsUnlocked}
                // @ts-ignore
                matchId={selectedMatchId}
              />
            </div>
          )}
        </>
      )}

      {currentView === "regionStats" && (
        <RegionStatsView
          onBack={() => navigateTo("home")}
          isSignedUp={isSignedUp}
          onShowLoginModal={() => setShowLoginModal(true)}
          userId={session?.user?.id}
        />
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