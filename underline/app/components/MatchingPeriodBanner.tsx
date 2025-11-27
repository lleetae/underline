'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock } from 'lucide-react';

export function MatchingPeriodBanner() {
    const [isMatchingPeriod, setIsMatchingPeriod] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkMatchingPeriod();

        // Check every hour
        const interval = setInterval(checkMatchingPeriod, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const checkMatchingPeriod = async () => {
        try {
            const { data, error } = await supabase.rpc('is_matching_period');

            if (error) {
                console.error('Error checking matching period:', error);
                return;
            }

            setIsMatchingPeriod(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return null;
    }

    if (isMatchingPeriod === null) {
        return null;
    }

    if (isMatchingPeriod) {
        // Matching period active (Friday-Saturday)
        return (
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">매칭 기간 진행 중!</span>
                </div>
                <p className="text-sm mt-1 opacity-90">
                    지금 마음에 드는 분께 첫인사를 보내보세요 ✨
                </p>
            </div>
        );
    }

    // Non-matching period (Sunday-Thursday)
    return (
        <div className="bg-gray-100 border-b border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">다음 매칭 기간을 기다려주세요</span>
            </div>
            <p className="text-sm mt-1 text-gray-600">
                📅 매칭 활성 기간: 매주 <strong>금요일 ~ 토요일</strong>
            </p>
            <p className="text-xs mt-2 text-gray-500">
                일요일~목요일은 신청 대기 기간입니다
            </p>
        </div>
    );
}
