"use client";

import { useEffect } from "react";
import { getToken, getMessaging, isSupported } from "firebase/messaging";
import { app } from "../lib/firebase";
import { supabase } from "../lib/supabase";

const VAPID_KEY = "BCGU8r_zOuEwQnW1rzeHwKURt_VQJJBhRFa7nK-oGxu3bmW8IyPNGat5t4EBZhNbx1xcIZQktwjQ3v4G1UkCnqk";

export default function NotificationPermissionRequest() {
    useEffect(() => {
        async function requestPermission() {
            console.log("[NotificationPermissionRequest] Starting permission request flow...");
            try {
                if (typeof window === "undefined") {
                    console.log("[NotificationPermissionRequest] Window is undefined, skipping.");
                    return;
                }

                const supported = await isSupported();
                console.log("[NotificationPermissionRequest] Firebase Messaging supported:", supported);

                if (!supported) {
                    console.log("[NotificationPermissionRequest] Firebase Messaging not supported in this browser");
                    return;
                }

                const messaging = getMessaging(app);
                console.log("[NotificationPermissionRequest] Messaging initialized");

                const permission = await Notification.requestPermission();
                console.log("[NotificationPermissionRequest] Permission status:", permission);

                if (permission === "granted") {
                    console.log("[NotificationPermissionRequest] Getting token...");
                    try {
                        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
                        console.log("[NotificationPermissionRequest] FCM Token obtained:", token);

                        // Save token to server
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                            console.log("[NotificationPermissionRequest] Sending token to server...");
                            const response = await fetch("/api/notifications/token", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${session.access_token}`
                                },
                                body: JSON.stringify({ token }),
                            });
                            console.log("[NotificationPermissionRequest] Server response:", response.status);
                        } else {
                            console.log("[NotificationPermissionRequest] No session found, cannot save token.");
                        }
                    } catch (tokenError) {
                        console.error("[NotificationPermissionRequest] Error getting token:", tokenError);
                    }
                } else if (permission === "denied") {
                    console.log("[NotificationPermissionRequest] Notification permission denied");
                }
            } catch (error) {
                console.error("[NotificationPermissionRequest] Error requesting notification permission:", error);
            }
        }

        requestPermission();
    }, []);

    // Handle foreground messages
    useEffect(() => {
        async function setupForegroundListener() {
            try {
                if (typeof window !== "undefined" && await isSupported()) {
                    const { onMessage } = await import("firebase/messaging");
                    const messaging = getMessaging(app);

                    const unsubscribe = onMessage(messaging, (payload) => {
                        console.log("[NotificationPermissionRequest] Foreground message received:", payload);
                        // You can customize how to show the notification here.
                        // Since we have a service worker for background, this is for when the app is OPEN.
                        // We can use the browser's Notification API if permission is granted, 
                        // OR just show a toast/snackbar.

                        if (payload.notification) {
                            const { title, body } = payload.notification;
                            // Example: Show a system notification even in foreground (if supported/allowed)
                            // Or better, use your UI library's toast
                            // import { toast } from "sonner"; // Assuming you use sonner
                            // toast(title, { description: body });

                            // For now, let's try to spawn a system notification if the browser allows it in foreground
                            new Notification(title || "New Message", {
                                body: body,
                                icon: "/icons/icon-192x192.png"
                            });
                        }
                    });

                    return () => unsubscribe();
                }
            } catch (error) {
                console.error("[NotificationPermissionRequest] Error setting up foreground listener:", error);
            }
        }

        setupForegroundListener();
    }, []);

    return null; // This component doesn't render anything visible
}


