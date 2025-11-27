import { useState, useEffect } from 'react';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

/**
 * Calculates the time remaining until the next occurrence of a specific day of the week and hour.
 * @param targetDayOfWeek 0 (Sunday) to 6 (Saturday)
 * @param targetHour 0 to 23
 * @returns TimeLeft object
 */
export const useCountdown = (targetDayOfWeek: number, targetHour: number = 0): TimeLeft => {
    const calculateTimeLeft = (): TimeLeft => {
        const now = new Date();
        const target = new Date(now);

        const currentDay = now.getDay();

        // Calculate days until target day
        // (targetDay - currentDay + 7) % 7
        let daysUntilTarget = (targetDayOfWeek - currentDay + 7) % 7;

        // If today is the target day, check if the hour has passed
        if (daysUntilTarget === 0) {
            const currentHour = now.getHours();
            if (currentHour >= targetHour) {
                daysUntilTarget = 7;
            }
        }

        target.setDate(now.getDate() + daysUntilTarget);
        target.setHours(targetHour, 0, 0, 0);

        // Double check if target is in the past (should be covered by logic above but safe to check)
        if (target.getTime() <= now.getTime()) {
            target.setDate(target.getDate() + 7);
        }

        const difference = target.getTime() - now.getTime();

        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDayOfWeek, targetHour]);

    return timeLeft;
};
