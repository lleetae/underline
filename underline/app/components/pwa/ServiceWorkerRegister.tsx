'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        workbox: any;
    }
}

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator && window.workbox !== undefined) {
            const wb = window.workbox;
            wb.register();
        } else if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    return null;
}
