// Verify KST conversion logic
// We want to ensure that regardless of system time, the output Date object reflects KST time components.

const originalDate = Date;

// Helper to simulate system timezone if possible, but JS Date uses system locale.
// Instead, we will check if the logic correctly shifts time when we mock the current time.

// Since we can't easily change system timezone in this script execution environment,
// we will verify that `toLocaleString("en-US", { timeZone: "Asia/Seoul" })` returns the expected KST time
// for a known UTC time.

const testDateUTC = new Date("2023-11-28T05:00:00Z"); // 14:00 KST
console.log("Test UTC Time:", testDateUTC.toISOString());

const kstString = testDateUTC.toLocaleString("en-US", { timeZone: "Asia/Seoul" });
console.log("KST String:", kstString);

const kstDate = new Date(kstString);
console.log("KST Date Object:", kstDate.toString());
console.log("KST Hours (Local Getter):", kstDate.getHours());

// Expected: kstDate.getHours() should be 14.
if (kstDate.getHours() === 14) {
    console.log("SUCCESS: KST conversion is correct.");
} else {
    console.error("FAILURE: KST conversion failed. Expected 14, got " + kstDate.getHours());
}
