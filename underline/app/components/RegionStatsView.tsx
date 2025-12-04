import React, { useState, useEffect } from "react";
import { ChevronLeft, Share2, Copy, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { BatchUtils } from "../utils/BatchUtils";
import { handleCopy } from "../utils/clipboard";
import { getRegionGroupKey, getRegionDisplayName } from "../utils/RegionUtils";

interface RegionStatsViewProps {
    onBack: () => void;
    isSignedUp: boolean;
    onShowLoginModal: () => void;
    userId?: string;
}

export function RegionStatsView({ onBack, isSignedUp, onShowLoginModal, userId }: RegionStatsViewProps) {
    const [stats, setStats] = useState<Record<string, { male: number; female: number; total: number }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showReferralModal, setShowReferralModal] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { start, end } = BatchUtils.getBatchApplicationRange(BatchUtils.getTargetBatchStartDate());

                const { data, error } = await supabase
                    .from('dating_applications')
                    .select(`
            member_id,
            member!inner (
              sido,
              gender
            )
          `)
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString())
                    .neq('status', 'cancelled');

                if (error) throw error;

                if (data) {
                    const newStats: Record<string, { male: number; female: number; total: number }> = {};

                    data.forEach((app: any) => {
                        const sido = app.member?.sido || '기타';
                        const groupKey = getRegionGroupKey(sido);
                        const gender = app.member?.gender;

                        if (!newStats[groupKey]) {
                            newStats[groupKey] = { male: 0, female: 0, total: 0 };
                        }

                        if (gender === 'male') newStats[groupKey].male++;
                        else if (gender === 'female') newStats[groupKey].female++;

                        newStats[groupKey].total++;
                    });

                    setStats(newStats);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getRegionName = (key: string) => {
        return getRegionDisplayName(key as any);
    };

    const sortedRegions = Object.entries(stats)
        .filter(([_, data]) => data.total > 0)
        .sort((a, b) => b[1].total - a[1].total);

    return (
        <div className="min-h-screen bg-[#FCFCFA] flex flex-col w-full max-w-md mx-auto shadow-2xl shadow-black/5">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-black/5 px-4 h-[60px] flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="font-serif text-lg font-bold text-underline-text">지역별 신청 현황</h1>
            </div>

            <div className="p-6 space-y-4">
                <div className="bg-[#F5F5F0] p-4 rounded-xl mb-6">
                    <p className="text-sm text-underline-text/60 leading-relaxed">
                        각 지역별로 <span className="font-bold text-underline-text">남녀 각 5명 이상</span>이 모여야<br />
                        해당 지역의 매칭이 시작됩니다.
                    </p>
                    <button
                        onClick={() => {
                            if (!isSignedUp) {
                                onShowLoginModal();
                            } else {
                                setShowReferralModal(true);
                            }
                        }}
                        className="w-full py-3 mt-3 bg-white border border-underline-red text-underline-red rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
                    >
                        <Share2 className="w-4 h-4" />
                        친구 초대해서 우리 동네 오픈하기
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-20 text-gray-400">불러오는 중...</div>
                ) : sortedRegions.length > 0 ? (
                    <div className="w-full grid grid-cols-2 gap-3">
                        {sortedRegions.map(([region, data]) => {
                            const isOpen = data.male >= 5 && data.female >= 5;

                            return (
                                <div key={region} className={`p-5 rounded-xl border ${isOpen ? 'bg-white border-underline-red/20 shadow-sm' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-bold text-sm text-underline-text">{getRegionName(region)}</span>
                                        {isOpen ? (
                                            <span className="text-[9px] font-bold text-white bg-underline-red px-1.5 py-0.5 rounded-full shadow-sm">오픈 확정</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">모집중</span>
                                        )}
                                    </div>

                                    <div className="flex items-end gap-1 mb-3">
                                        <span className={`text-2xl font-serif font-bold ${isOpen ? 'text-underline-red' : 'text-blue-600'}`}>
                                            {data.total}
                                        </span>
                                        <span className="text-xs text-blue-600 mb-1">명</span>
                                    </div>

                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${isOpen ? 'bg-underline-red' : 'bg-blue-400'}`}
                                            style={{ width: `${Math.min((data.total / 10) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        아직 신청자가 없습니다.
                    </div>
                )}
            </div>

            {/* Referral Modal */}
            {showReferralModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowReferralModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="font-serif text-xl font-bold mb-6 text-center text-underline-text">
                            친구 초대 혜택
                        </h3>

                        <div className="space-y-4 mb-8">
                            <div className="bg-[#F5F5F0] p-4 rounded-xl flex items-center gap-4">
                                <div className="w-10 h-10 bg-underline-red/10 rounded-full flex items-center justify-center text-xl">
                                    🎁
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold mb-0.5">나 (초대자)</p>
                                    <p className="text-sm font-medium text-underline-text">무료 연락처 교환권 1장</p>
                                </div>
                            </div>

                            <div className="bg-[#F5F5F0] p-4 rounded-xl flex items-center gap-4">
                                <div className="w-10 h-10 bg-underline-red/10 rounded-full flex items-center justify-center text-xl">
                                    🎟️
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold mb-0.5">친구 (초대받은 사람)</p>
                                    <p className="text-sm font-medium text-underline-text">연락처 교환 50% 할인 쿠폰</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-underline-red/80 font-medium text-center mb-3">
                            *복사한 링크를 통해 가입해야 쿠폰을 받으실 수 있습니다
                        </p>

                        <button
                            onClick={() => {
                                const shareUrl = `${window.location.origin}?ref=${userId || ''}`;
                                handleCopy(shareUrl, '초대 링크가 복사되었습니다!');
                                setShowReferralModal(false);
                            }}
                            className="w-full py-3.5 bg-underline-red text-white rounded-xl font-bold shadow-lg shadow-underline-red/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                        >
                            <Copy className="w-4 h-4" />
                            초대 링크 복사하기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
