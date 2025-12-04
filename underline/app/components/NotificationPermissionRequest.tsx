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

    return null; // This component doesn't render anything visible
}


