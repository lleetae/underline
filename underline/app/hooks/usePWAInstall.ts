import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global variable to persist event across component unmounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // 1. Check if already installed (Standalone mode)
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        setIsStandalone(isStandaloneMode);

        if (isStandaloneMode) return;

        // 2. Detect OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);

        // 3. Listen for 'beforeinstallprompt' (Android/Chrome)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault(); // Prevent automatic mini-infobar
            globalDeferredPrompt = e as BeforeInstallPromptEvent; // Save globally
            setDeferredPrompt(globalDeferredPrompt);
        };

        // If we already have the event, set state immediately
        if (globalDeferredPrompt) {
            setDeferredPrompt(globalDeferredPrompt);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const triggerInstall = async () => {
        if (isIOS) {
            // iOS doesn't support programmatic install.
            // The UI should show a guide modal instead.
            return 'ios_guide';
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                setDeferredPrompt(null);
                globalDeferredPrompt = null; // Clear global logic too
            } else {
                console.log('User dismissed the install prompt');
            }
            return 'prompt_triggered';
        }

        return 'no_prompt';
    };

    return {
        isStandalone,
        isIOS,
        canInstall: !!deferredPrompt || isIOS, // Show install UI if prompted (Android) or always on iOS (guidance)
        triggerInstall,
    };
}
