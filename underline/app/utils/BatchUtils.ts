import { startOfWeek, addDays, format, subDays, nextSunday } from 'date-fns';

export type SystemState = 'REGISTRATION' | 'MATCHING';

export class BatchUtils {
    /**
     * Returns the current system state based on the day of the week.
     * Registration: Sunday to Thursday
     * Matching: Friday to Saturday
     */
    /**
     * Returns the current time in KST (UTC+9).
     * This ensures consistent logic regardless of server timezone.
     */
    static getNowKST(): Date {
        // Create a date object from the current time converted to KST string
        // This creates a Date object where the "local" time components match KST time.
        // Note: The actual timezone offset of this object will still be the system's offset,
        // but the hours/minutes/date will be correct for KST.
        // e.g. If it's 10:00 KST, this object will return 10:00 when getHours() is called (if system is same)
        // Wait, toLocaleString returns a string. new Date(string) parses it.
        // If the string doesn't have timezone info, it parses as local time.
        // So "2023-11-28 14:00:00" (KST time) parsed in UTC system -> 14:00 UTC.
        // This is exactly what we want if we use local getters (getHours, getDay).

        const now = new Date();
        const kstString = now.toLocaleString("en-US", { timeZone: "Asia/Seoul" });
        return new Date(kstString);
    }

    /**
     * Returns the current system state based on the day of the week.
     * Registration: Sunday to Thursday
     * Matching: Friday to Saturday
     */
    static getCurrentSystemState(): SystemState {
        const now = BatchUtils.getNowKST();
        // Friday (5) or Saturday (6) -> MATCHING
        // Sunday (0) to Thursday (4) -> REGISTRATION
        const day = now.getDay();
        if (day === 5 || day === 6) {
            return 'MATCHING';
        }
        return 'REGISTRATION';
    }

    /**
     * Returns the start date (Sunday) of the batch that is currently "active" for matching.
     * If today is Fri/Sat, the active batch is the one that started last Sunday.
     * If today is Sun-Thu, there is no "active matching" batch, but we usually refer to the current week.
     */
    static getCurrentBatchStartDate(): Date {
        const now = BatchUtils.getNowKST();
        return startOfWeek(now, { weekStartsOn: 0 }); // 0 is Sunday
    }

    /**
     * Returns the start date (Sunday) of the batch that a user would apply for RIGHT NOW.
     * If REGISTRATION (Sun-Thu): Returns This Sunday.
     * If MATCHING (Fri-Sat): Returns Next Sunday.
     */
    static getTargetBatchStartDate(): Date {
        const now = BatchUtils.getNowKST();
        const state = this.getCurrentSystemState();

        if (state === 'MATCHING') {
            return nextSunday(now);
        }
        return startOfWeek(now, { weekStartsOn: 0 });
    }

    /**
     * Returns the valid application range for a given batch start date (Sunday).
     * A batch covers applications from the previous Friday (early bird) to the Thursday of the batch week.
     * However, to be safe and inclusive of the "Registration" period (Sun-Thu),
     * we can define the range as:
     * Start: Batch Start Date (Sunday) 00:00
     * End: Batch Start Date + 4 days (Thursday) 23:59:59
     * 
     * Note: If we allow "early bird" application on Fri/Sat of previous week, 
     * the range should technically be wider or we just check the batch_id if we had one.
     * Since we use created_at, let's define the "Valid Application Window" for a batch strictly.
     * 
     * Revised Logic based on User Flow:
     * Users apply during Sun-Thu for the CURRENT batch.
     * Users apply during Fri-Sat for the NEXT batch.
     * 
     * So, for a batch starting on Sunday S:
     * Applications could have been made on:
     * 1. The previous Fri-Sat (Early)
     * 2. The current Sun-Thu (Regular)
     * 
     * Range: [S - 2 days, S + 4 days]
     * Example: Batch Sun Nov 26.
     * Valid Apps: Fri Nov 24 00:00 ~ Thu Nov 30 23:59.
     */
    static getBatchApplicationRange(batchStartDate: Date): { start: Date, end: Date } {
        const start = subDays(batchStartDate, 2); // Friday before
        start.setHours(0, 0, 0, 0);

        const end = addDays(batchStartDate, 4); // Thursday
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }

    /**
     * Formats a date as YYYY-MM-DD for DB comparison if needed, 
     * or just returns the Date object for range queries.
     */
    static formatDate(date: Date): string {
        return format(date, 'yyyy-MM-dd');
    }
    /**
     * Returns the start date (Friday 00:00) of the current interaction cycle.
     * Cycle: Friday 00:00 ~ Next Thursday 23:59.
     * If today is Fri/Sat (Matching Phase), the cycle started THIS Friday.
     * If today is Sun-Thu (Registration Phase), the cycle started LAST Friday.
     */
    static getCurrentInteractionCycleStart(): Date {
        const now = BatchUtils.getNowKST();
        const day = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

        let startDate: Date;

        if (day >= 5) {
            // Fri(5), Sat(6) -> This Friday
            // If today is Fri, diff=0. If Sat, diff=1.
            startDate = subDays(now, day - 5);
        } else {
            // Sun(0) ~ Thu(4) -> Last Friday
            // We can find the previous Sunday, then go back 2 days.
            const thisSunday = startOfWeek(now, { weekStartsOn: 0 });
            startDate = subDays(thisSunday, 2);
        }

        startDate.setHours(0, 0, 0, 0);
        return startDate;
    }
}
