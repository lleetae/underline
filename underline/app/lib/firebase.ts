import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAbRasN-9KeAurt241OOo_qtPaPMZVO9tQ",
    authDomain: "underline-eea9d.firebaseapp.com",
    projectId: "underline-eea9d",
    storageBucket: "underline-eea9d.firebasestorage.app",
    messagingSenderId: "140189693870",
    appId: "1:140189693870:web:41a4a758212e499013fa3f",
    measurementId: "G-22LSMY9W9V"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Messaging
let messaging: any = null;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            messaging = getMessaging(app);
        }
    });
}

// Initialize Analytics
let analytics: any = null;
if (typeof window !== "undefined") {
    isAnalyticsSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, messaging, analytics };
