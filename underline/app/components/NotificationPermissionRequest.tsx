"use client";

import { useEffect } from "react";
import { getToken, getMessaging, isSupported } from "firebase/messaging";
import { app } from "../lib/firebase";

const VAPID_KEY = "BCGU8r_zOuEwQnW1rzeHwKURt_VQJJBhRFa7nK-oGxu3bmW8IyPNGat5t4EBZhNbx1xcIZQktwjQ3v4G1UkCnqk";

export default function NotificationPermissionRequest() {
    useEffect(() => {
        async function requestPermission() {
            try {
                if (typeof window === "undefined") return;

                const supported = await isSupported();
                if (!supported) {
                    console.log("Firebase Messaging not supported in this browser");
                    return;
                }

                const messaging = getMessaging(app);

                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
                    console.log("FCM Token:", token);
                    // TODO: Send this token to the server to save it for the user
                } else if (permission === "denied") {
                    console.log("Notification permission denied");
                }
            } catch (error) {
                console.error("Error requesting notification permission:", error);
            }
        }

        requestPermission();
    }, []);

    return null; // This component doesn't render anything visible
}


