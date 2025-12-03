import React, { useState, useEffect } from "react";
import { ArrowLeft, Bell, Heart, CreditCard, User } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

interface Notification {
    id: string;
    type: 'match_request' | 'match_accepted' | 'contact_revealed';
    match_id: string;
    sender_id: string;
    is_read: boolean;
    created_at: string;
    metadata: Record<string, any>;
    sender?: {
        id: string;
        nickname: string;
        photo_urls_blurred: string[];
    };
}

interface NotificationsViewProps {
    onBack: () => void;
    onNavigateToMatch?: (matchId: string, notificationType: 'match_request' | 'match_accepted' | 'contact_revealed') => void;
}

export function NotificationsView({ onBack, onNavigateToMatch }: NotificationsViewProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string>('');
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            setUserId(session?.user?.id || 'No Session');

            const response = await fetch(`/api/notifications?t=${new Date().getTime()}`, {
                cache: 'no-store',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log("NotificationsView fetched:", data);
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
                setDebugInfo(data.debugInfo);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("알림을 불러오는데 실패했습니다");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ notificationId })
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ markAllAsRead: true })
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
                toast.success("모든 알림을 읽음 처리했습니다");
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error("알림 처리에 실패했습니다");
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        if (onNavigateToMatch) {
            onNavigateToMatch(notification.match_id, notification.type);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'match_request':
                return <Heart className="w-5 h-5 text-[var(--primary)]" />;
            case 'match_accepted':
                return <Heart className="w-5 h-5 text-[var(--primary)] fill-[var(--primary)]" />;
            case 'contact_revealed':
                return <CreditCard className="w-5 h-5 text-[var(--primary)]" />;
            default:
                return <Bell className="w-5 h-5 text-[var(--primary)]" />;
        }
    };

    const getNotificationMessage = (notification: Notification) => {
        const senderName = notification.sender?.nickname || '알 수 없음';
        switch (notification.type) {
            case 'match_request':
                return `${senderName}님이 매칭을 신청했습니다`;
            case 'match_accepted':
                return `${senderName}님이 매칭을 수락했습니다`;
            case 'contact_revealed':
                return `${senderName}님이 결제를 완료하여 연락처가 공개되었습니다`;
            default:
                return '새로운 알림이 있습니다';
        }
    };

    const getTimeAgo = (createdAt: string) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return created.toLocaleDateString('ko-KR');
    };

    if (loading) {
        return (
            <div className="w-full max-w-md mx-auto min-h-screen bg-[#FCFCFA] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md relative shadow-2xl shadow-black/5 min-h-screen bg-[#FCFCFA] flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#FCFCFA] border-b border-[var(--foreground)]/10">
                <div className="flex items-center justify-between px-6 py-4">
                    <button
                        onClick={onBack}
                        className="p-1 hover:bg-[var(--foreground)]/5 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
                    </button>
                    <h1 className="font-serif text-2xl text-[var(--foreground)]">알림</h1>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-[var(--primary)] font-sans hover:underline"
                        >
                            모두 읽음
                        </button>
                    )}
                    {unreadCount === 0 && <div className="w-16" />}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-[var(--primary)]/40" />
                        </div>
                        <h3 className="font-serif text-xl text-[var(--foreground)] mb-2">
                            알림이 없습니다
                        </h3>
                        <p className="text-sm text-[var(--foreground)]/60 font-sans text-center leading-relaxed">
                            새로운 매칭 신청이나 소식이 있으면<br />
                            여기에 알려드릴게요
                        </p>
                    </div>
                ) : (
                    // Notification List
                    <div className="divide-y divide-[var(--foreground)]/5">
                        {notifications.map((notification) => (
                            <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full px-6 py-4 flex gap-4 hover:bg-[#FCFCFA]/50 transition-colors text-left ${!notification.is_read ? 'bg-[var(--primary)]/5' : ''
                                    }`}
                            >
                                {/* Sender Photo */}
                                <div className="flex-shrink-0">
                                    {notification.sender?.photo_urls_blurred?.[0] ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--foreground)]/10">
                                            <ImageWithFallback
                                                src={notification.sender.photo_urls_blurred[0]}
                                                alt="Sender"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 flex items-center justify-center">
                                            <User className="w-6 h-6 text-[var(--foreground)]/30" />
                                        </div>
                                    )}
                                </div>

                                {/* Notification Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 mb-1">
                                        {getNotificationIcon(notification.type)}
                                        <p className="flex-1 text-sm text-[var(--foreground)] font-sans leading-relaxed">
                                            {getNotificationMessage(notification)}
                                        </p>
                                        {!notification.is_read && (
                                            <div className="flex-shrink-0 w-2 h-2 bg-[var(--primary)] rounded-full mt-1" />
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--foreground)]/40 font-sans">
                                        {getTimeAgo(notification.created_at)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Temporary Debug Info */}
            <div className="p-4 bg-black text-white text-xs overflow-auto max-h-40">
                <p>Debug Info:</p>
                <p>My User ID: {userId}</p>
                <p>Server User ID: {debugInfo?.queriedUserId} (Len: {debugInfo?.userIdLength})</p>
                <p>Raw Count: {debugInfo?.rawCount}</p>
                <p>Fallback Count: {debugInfo?.fallbackCount}</p>
                <p>Hardcoded Check: {debugInfo?.hardcodedCheck}</p>
                <p>Member Check: {debugInfo?.memberCheck ? 'FOUND' : 'NOT FOUND'}</p>
                <p>Total Notifs in DB: {debugInfo?.totalNotificationsCheck}</p>
                <p>DB URL: {debugInfo?.maskedUrl}</p>
                <p>Env Check: {debugInfo?.envCheck ? 'OK' : 'MISSING'}</p>
                <p>Loading: {loading ? 'true' : 'false'}</p>
                <p>Count: {notifications.length}</p>
                <pre>{JSON.stringify(notifications, null, 2)}</pre>
                <pre>Params: {JSON.stringify(debugInfo?.params)}</pre>
            </div>
        </div>
    );
}
