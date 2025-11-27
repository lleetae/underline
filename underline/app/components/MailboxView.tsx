import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { MailboxHeader } from "./mailbox/MailboxHeader";
import { MatchList } from "./mailbox/MatchList";
import { MailboxTabs } from "./mailbox/MailboxTabs";
import { RejectConfirmModal } from "./RejectConfirmModal";

interface SentMatchRequest {
  profileId: string;
  nickname: string;
  age: number;
  location: string;
  photo: string;
  letter: string;
  timestamp: Date;
}

interface ReceivedMatchRequest {
  id: string;
  profileId: string;
  nickname: string;
  age: number;
  location: string;
  photo: string;
  letter: string;
  timestamp: Date;
}

export function MailboxView({
  sentMatchRequests,
  receivedMatchRequests,
  onProfileClick,
  activeTab,
  onTabChange,
  onAcceptMatch,
  onRejectMatch,
  onShowNotifications
}: {
  sentMatchRequests?: SentMatchRequest[];
  receivedMatchRequests?: ReceivedMatchRequest[];
  onProfileClick?: (profileId: string, source: "home" | "mailbox") => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAcceptMatch?: (requestId: string) => void;
  onRejectMatch?: (requestId: string) => void;
  onShowNotifications?: () => void;
}) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReceivedMatchRequest | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [animateDirection, setAnimateDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tabOrder: Array<"sent" | "received" | "matched"> = ["sent", "received", "matched"];

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/notifications?unread_only=true', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRejectClick = (request: ReceivedMatchRequest) => {
    setSelectedRequest(request);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedRequest) {
      onRejectMatch?.(selectedRequest.id);
      setRejectModalOpen(false);
      setSelectedRequest(null);
    }
  };

  const handleAcceptFromModal = () => {
    if (selectedRequest) {
      onAcceptMatch?.(selectedRequest.id);
      setRejectModalOpen(false);
      setSelectedRequest(null);
    }
  };

  // Helper function to display location text
  const getLocationText = (location: string) => {
    const locationMap: { [key: string]: string } = {
      seoul: "서울",
      busan: "부산",
      incheon: "인천",
      daegu: "대구",
      daejeon: "대전",
      gwangju: "광주",
      other: "기타"
    };
    return locationMap[location] || location;
  };

  const handleTabChange = (tab: string) => {
    const currentIndex = tabOrder.indexOf(activeTab as "sent" | "received" | "matched");
    const nextIndex = tabOrder.indexOf(tab as "sent" | "received" | "matched");

    if (nextIndex > currentIndex) setAnimateDirection("left");
    if (nextIndex < currentIndex) setAnimateDirection("right");

    onTabChange(tab);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchDeltaX(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Ignore vertical scroll gestures
    if (Math.abs(deltaY) > Math.abs(deltaX) + 20) return;

    setTouchDeltaX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!touchStart) {
      setIsDragging(false);
      return;
    }

    const threshold = 40;
    if (touchDeltaX < -threshold) {
      // Swipe left -> next tab
      const currentIndex = tabOrder.indexOf(activeTab as "sent" | "received" | "matched");
      if (currentIndex < tabOrder.length - 1) {
        handleTabChange(tabOrder[currentIndex + 1]);
      }
    } else if (touchDeltaX > threshold) {
      // Swipe right -> prev tab
      const currentIndex = tabOrder.indexOf(activeTab as "sent" | "received" | "matched");
      if (currentIndex > 0) {
        handleTabChange(tabOrder[currentIndex - 1]);
      }
    }

    setTouchStart(null);
    setTouchDeltaX(0);
    setIsDragging(false);
  };

  useEffect(() => {
    // Trigger a small transition on tab change for smoothness
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 260);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const dragOffset = Math.max(-60, Math.min(60, touchDeltaX));
  const slideOffset =
    !isDragging && isAnimating && animateDirection
      ? animateDirection === "left"
        ? -10
        : 10
      : 0;
  const translateX = isDragging ? dragOffset : slideOffset;
  const contentStyle: React.CSSProperties = {
    transform: `translateX(${translateX}px)`,
    transition: isDragging
      ? "none"
      : "transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 240ms ease",
    opacity: isDragging ? 0.98 : isAnimating ? 0.95 : 1,
    willChange: "transform, opacity",
  };

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      <MailboxHeader onShowNotifications={onShowNotifications} unreadCount={unreadCount} />
      <MailboxTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div
        className="flex-1 bg-[#FCFCFA] pb-24 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={contentStyle}>
        {activeTab === "received" ? (
          <div className="px-6 py-4">
            {receivedMatchRequests && receivedMatchRequests.length > 0 ? (
              <div className="space-y-3">
                {receivedMatchRequests.map((request, index) => (
                  <React.Fragment key={request.id}>
                    {index > 0 && (
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[#1A3C34]/10"></div>
                        </div>
                      </div>
                    )}
                    <div
                      onClick={() => onProfileClick?.(request.profileId, "mailbox")}
                      className="bg-white border border-[#1A3C34]/10 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex gap-3 mb-3">
                        <div
                          className="w-14 h-14 rounded-full overflow-hidden border border-[#1A3C34]/10 flex-shrink-0"
                        >
                          <img
                            src={request.photo}
                            alt={request.nickname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <h3 className="font-sans font-medium text-[#1A3C34]">
                              {request.nickname}
                            </h3>
                            <span className="text-sm text-[#1A3C34]/60 font-sans">
                              만 {request.age}세
                            </span>
                          </div>
                          <p className="text-xs text-[#1A3C34]/50 font-sans">
                            {getLocationText(request.location)}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border border-[#D4AF37]/20 rounded-lg p-3">
                        <p className="font-serif text-sm text-[#1A3C34] leading-relaxed whitespace-pre-wrap line-clamp-3">
                          {request.letter}
                        </p>
                      </div>
                      <p className="text-xs text-[#1A3C34]/40 font-sans mt-2">
                        {new Date(request.timestamp).toLocaleString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 px-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcceptMatch?.(request.id);
                        }}
                        className="flex-1 py-2.5 bg-[#1A3C34] text-[#FCFCFA] rounded-lg hover:bg-[#1A3C34]/90 transition-colors font-sans text-sm"
                      >
                        수락
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectClick(request);
                        }}
                        className="flex-1 py-2.5 bg-white border border-[#1A3C34]/20 text-[#1A3C34] rounded-lg hover:bg-[#FCFCFA] transition-colors font-sans text-sm"
                      >
                        거절
                      </button>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[#1A3C34]/40 text-sm font-sans">
                <p>아직 받은 매칭 신청이 없습니다.</p>
              </div>
            )}
          </div>
        ) : activeTab === "matched" ? (
          <MatchList onProfileClick={onProfileClick} />
        ) : activeTab === "sent" ? (
          <div className="px-6 py-4">
            {sentMatchRequests && sentMatchRequests.length > 0 ? (
              <div className="space-y-3">
                {sentMatchRequests.map((request, index) => (
                  <div
                    key={`${request.profileId}-${index}`}
                    onClick={() => onProfileClick?.(request.profileId, "mailbox")}
                    className="bg-white border border-[#1A3C34]/10 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex gap-3 mb-3">
                      <div
                        className="w-14 h-14 rounded-full overflow-hidden border border-[#1A3C34]/10 flex-shrink-0"
                      >
                        <img
                          src={request.photo}
                          alt={request.nickname}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h3 className="font-sans font-medium text-[#1A3C34]">
                            {request.nickname}
                          </h3>
                          <span className="text-sm text-[#1A3C34]/60 font-sans">
                            만 {request.age}세
                          </span>
                        </div>
                        <p className="text-xs text-[#1A3C34]/50 font-sans">
                          {getLocationText(request.location)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#D4AF37] font-sans">
                          수락 대기중
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border border-[#D4AF37]/20 rounded-lg p-3">
                      <p className="font-serif text-sm text-[#1A3C34] leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {request.letter}
                      </p>
                    </div>
                    <p className="text-xs text-[#1A3C34]/40 font-sans mt-2">
                      {new Date(request.timestamp).toLocaleString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[#1A3C34]/40 text-sm font-sans">
                <p>아직 보낸 매칭 신청이 없습니다.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-[#1A3C34]/40 text-sm font-sans">
            <p>아직 메시지가 없습니다.</p>
          </div>
        )}
        </div>
      </div>
      <RejectConfirmModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        onAccept={handleAcceptFromModal}
        nickname={selectedRequest?.nickname || ""}
      />
    </div>
  );
}
