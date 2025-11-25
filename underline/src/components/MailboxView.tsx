import React, { useState } from "react";
import { Heart, MapPin, BookOpen, Calendar, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MatchList } from "./mailbox/MatchList";
import { BottomNav } from "./mailbox/BottomNav";
import { MailboxHeader } from "./mailbox/MailboxHeader";
import { MailboxTabs } from "./mailbox/MailboxTabs";
import { RejectConfirmModal } from "./RejectConfirmModal";
import { CancelMatchModal } from "./CancelMatchModal";

interface SentMatchRequest {
  profileId: string;
  nickname: string;
  age: number;
  location: string;
  photo: string;
  sentence: string;
  timestamp: Date;
}

interface ReceivedMatchRequest {
  id: string;
  profileId: string;
  nickname: string;
  age: number;
  location: string;
  photo: string;
  sentence: string;
  timestamp: Date;
}

export function MailboxView({ 
  sentMatchRequests,
  receivedMatchRequests,
  onProfileClick,
  activeTab,
  onTabChange,
  onAcceptMatch,
  onRejectMatch
}: { 
  sentMatchRequests?: SentMatchRequest[]; 
  receivedMatchRequests?: ReceivedMatchRequest[];
  onProfileClick?: (profileId: string, source: "home" | "mailbox") => void;
  activeTab: string;
  onTabChange: (tab: "matched" | "sent" | "messages") => void;
  onAcceptMatch?: (requestId: string) => void;
  onRejectMatch?: (requestId: string) => void;
}) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReceivedMatchRequest | null>(null);

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

  return (
    <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
      <MailboxHeader />
      <MailboxTabs activeTab={activeTab} onTabChange={onTabChange} />
      
      <div className="flex-1 bg-[#FCFCFA]">
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
                            {request.location}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border border-[#D4AF37]/20 rounded-lg p-3">
                        <p className="font-serif text-sm text-[#1A3C34] italic leading-relaxed">
                          "{request.sentence}"
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
                          {request.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#D4AF37] font-sans">
                          신청 완료
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#FCFCFA] to-[#F5F5F0] border border-[#D4AF37]/20 rounded-lg p-3">
                      <p className="font-serif text-sm text-[#1A3C34] italic leading-relaxed">
                        "{request.sentence}"
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