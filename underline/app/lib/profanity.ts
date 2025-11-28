const Filter = require('bad-words');

const koreanBadWords = [
    "시발", "씨발", "병신", "개새끼", "좆", "창녀", "지랄", "염병", "쓰레기", "미친",
    "닥쳐", "꺼져", "놈", "년", "새끼", "죽어", "자살", "살인", "강간", "마약",
    "섹스", "성관계", "보지", "자지", "야동", "변태", "걸레", "따먹", "씹", "좆까"
];

const filter = new Filter();

export function checkProfanity(text: string): boolean {
    // 1. Check English profanity
    if (filter.isProfane(text)) {
        return true;
    }

    // 2. Check Korean profanity
    // Simple substring check for now. 
    // Ideally, we'd want more sophisticated matching (e.g., ignoring spaces, numbers, etc.)
    // but this covers the basics.
    for (const word of koreanBadWords) {
        if (text.includes(word)) {
            return true;
        }
    }

    return false;
}
