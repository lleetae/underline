import React from 'react';
import { Share, PlusSquare } from 'lucide-react';

export function IOSInstallGuide() {
    return (
        <div className="space-y-6 pt-2">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                    <Share className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">1단계</p>
                    <p className="text-sm text-gray-600">
                        사파리 브라우저 하단의 <br />
                        <span className="font-bold text-blue-600">공유 버튼</span>을 눌러주세요.
                    </p>
                </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                    <PlusSquare className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">2단계</p>
                    <p className="text-sm text-gray-600">
                        메뉴에서 아래로 내려 <br />
                        <span className="font-bold text-gray-800">'홈 화면에 추가'</span>를 선택하세요.
                    </p>
                </div>
            </div>

            <p className="text-xs text-center text-gray-400 mt-2">
                설치 후 앱을 실행하면 알림을 받을 수 있습니다.
            </p>
        </div>
    );
}
