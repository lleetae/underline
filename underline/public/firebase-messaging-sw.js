importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAbRasN-9KeAurt241OOo_qtPaPMZVO9tQ",
    authDomain: "underline-eea9d.firebaseapp.com",
    projectId: "underline-eea9d",
    storageBucket: "underline-eea9d.firebasestorage.app",
    messagingSenderId: "140189693870",
    appId: "1:140189693870:web:41a4a758212e499013fa3f",
    measurementId: "G-22LSMY9W9V"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
