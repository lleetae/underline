import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { IOSInstallGuide } from './IOSInstallGuide';
import { X, Download } from 'lucide-react';

export function PWAInstallBanner() {
    const { isStandalone, isIOS, canInstall, triggerInstall } = usePWAInstall();
    const [showIOSModal, setShowIOSModal] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || isStandalone || (!canInstall && !isIOS)) return null;

    const handleClick = () => {
        if (isIOS) {
            setShowIOSModal(true);
        } else {
            triggerInstall();
        }
    };

    return (
        <>
            {/* Sticky Banner */}
            <div className="fixed bottom-[100px] left-0 right-0 z-40 px-4 md:px-0 flex justify-center animate-in slide-in-from-bottom-4 duration-500">
                <div className="w-full max-w-md bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border border-white/10">
                    <div className="flex-1 mr-4" onClick={handleClick}>
                        <p className="text-sm font-bold text-white mb-0.5">매칭 결과를 놓치지 마세요!</p>
                        <p className="text-xs text-gray-300">앱 설치하고 실시간 알림 받기</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClick}
                            className="bg-underline-red hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <Download className="w-3.5 h-3.5" />
                            설치
                        </button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-400 hover:text-white p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* iOS Guide Modal (Only shown when banner is clicked on iOS) */}
            {showIOSModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95">
                        <button
                            onClick={() => setShowIOSModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="font-sans text-lg font-bold mb-4 text-center">앱 설치 방법</h3>
                        <IOSInstallGuide />
                    </div>
                </div>
            )}
        </>
    );
}
