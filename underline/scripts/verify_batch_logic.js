const { startOfWeek, addDays, isFriday, isSaturday, isSunday, format, subDays, nextSunday } = require('date-fns');

// Mock BatchUtils since we can't import TS directly in node script easily without compilation
// Copying logic for verification
class BatchUtils {
    static getCurrentSystemState(now) {
        const day = now.getDay();
        if (day === 5 || day === 6) {
            return 'MATCHING';
        }
        return 'REGISTRATION';
    }

    static getCurrentBatchStartDate(now) {
        return startOfWeek(now, { weekStartsOn: 0 });
    }

    static getTargetBatchStartDate(now) {
        const state = this.getCurrentSystemState(now);
        if (state === 'MATCHING') {
            return nextSunday(now);
        }
        return startOfWeek(now, { weekStartsOn: 0 });
    }

    static getBatchApplicationRange(batchStartDate) {
        const start = subDays(batchStartDate, 2); // Friday before
        start.setHours(0, 0, 0, 0);

        const end = addDays(batchStartDate, 4); // Thursday
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }
}

function test() {
    console.log("--- Testing Batch Logic ---");

    // Test Case 1: Wednesday (Registration)
    const wednesday = new Date('2023-11-29T12:00:00'); // Wed
    console.log(`\nDate: ${wednesday.toISOString()} (Wed)`);
    console.log(`State: ${BatchUtils.getCurrentSystemState(wednesday)} (Expected: REGISTRATION)`);
    console.log(`Target Batch: ${BatchUtils.getTargetBatchStartDate(wednesday).toISOString()} (Expected: Sun Nov 26)`);

    // Test Case 2: Friday (Matching)
    const friday = new Date('2023-12-01T12:00:00'); // Fri
    console.log(`\nDate: ${friday.toISOString()} (Fri)`);
    console.log(`State: ${BatchUtils.getCurrentSystemState(friday)} (Expected: MATCHING)`);
    console.log(`Target Batch: ${BatchUtils.getTargetBatchStartDate(friday).toISOString()} (Expected: Sun Dec 03)`);

    // Test Case 3: Application Range for Batch Dec 03
    const batchDec03 = new Date('2023-12-03T00:00:00');
    const range = BatchUtils.getBatchApplicationRange(batchDec03);
    console.log(`\nBatch Dec 03 Range:`);
    console.log(`Start: ${range.start.toISOString()} (Expected: Fri Dec 01)`);
    console.log(`End: ${range.end.toISOString()} (Expected: Thu Dec 07)`);
}

test();
