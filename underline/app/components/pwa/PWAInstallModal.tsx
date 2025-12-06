import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { IOSInstallGuide } from './IOSInstallGuide';
import { X, Download, Bell } from 'lucide-react';

export function PWAInstallModal() {
    const { isStandalone, isIOS, canInstall, triggerInstall } = usePWAInstall();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // 1. If already installed, do nothing
        if (isStandalone) return;

        // 2. Check "Don't show today"
        const hideDate = localStorage.getItem('pwa_hide_date');
        const today = new Date().toDateString();

        if (hideDate === today) {
            return;
        }

        // 3. Show modal if installable (or iOS which is always "installable")
        if (canInstall) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsOpen(true), 200);
            return () => clearTimeout(timer);
        }
    }, [isStandalone, canInstall]);

    const handleCloseToday = () => {
        const today = new Date().toDateString();
        localStorage.setItem('pwa_hide_date', today);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
        >
            <div
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 -mr-2 -mt-2 z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-underline-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-underline-red" />
                    </div>
                    <h3 className="font-sans text-xl font-bold mb-2 text-gray-900">
                        매칭 성공 알림 받기
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed break-keep">
                        앱을 설치하면 매칭 결과를<br />
                        <span className="font-bold text-gray-800">푸시 알림</span>으로 바로 받아보실 수 있어요!
                    </p>
                </div>

                {isIOS ? (
                    <IOSInstallGuide />
                ) : (
                    <button
                        onClick={triggerInstall}
                        className="w-full py-3.5 bg-underline-red text-white rounded-xl font-bold shadow-lg shadow-underline-red/20 flex items-center justify-center gap-2 active:scale-[0.95] transition-transform"
                    >
                        <Download className="w-5 h-5" />
                        앱 설치하고 알림 받기
                    </button>
                )}

                <button
                    onClick={handleCloseToday}
                    className="w-full mt-4 py-2 text-xs text-gray-400 hover:text-gray-600 font-medium underline decoration-gray-300 underline-offset-4"
                >
                    오늘 하루 보지 않기
                </button>
            </div>
        </div>
    );
}
