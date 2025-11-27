# Product Requirements Document (PRD): Underline

## 1. Product Overview
**Product Name:** Underline  
**One-Liner:** A premium dating platform connecting people through the books that shaped them.  
**Vision:** To move beyond superficial swiping and foster deep, meaningful connections based on intellectual and emotional resonance found in literature. "Read between the lines, find your underline."

## 2. Problem Statement
*   **Superficiality:** Modern dating apps focus heavily on physical appearance (photos) and short, often meaningless bios.
*   **Lack of Conversation Starters:** "Hey" or "How are you?" leads to dead-end conversations.
*   **Mismatched Values:** It's hard to gauge someone's values, depth, or personality type from a standard profile.

## 3. Target Audience
*   **Primary:** Adults (20s-30s) who enjoy reading and value intellectual connection.
*   **Secondary:** People tired of hookup culture/Tinder-style apps, looking for serious relationships or deep friendships.
*   **Psychographics:** Introverted, thoughtful, educated, values aesthetics and privacy.

## 4. Key Features & Scope (MVP)

### 4.1 Authentication & Onboarding
*   **Kakao Login:** Fast and familiar entry for Korean users.
*   **Phone Verification:** (Planned) To ensure user authenticity.

### 4.2 The "Life Book" Sign-Up Flow (Core Differentiator)
*   **Book Search:** Integration with Aladin API to search for books.
*   **Selection:** Users choose one "Life Book" that represents them.
*   **Review/Reason:** Users must write a thoughtful reason/review (minimum length enforced) explaining why this book is meaningful. This serves as the primary "Bio".
*   **Genre Mapping:** System captures genre (`categoryName`) to aid in matching.

### 4.3 Profile Creation
*   **Basic Info:** Nickname, Gender, Birthdate, Location.
*   **Lifestyle & Values:** Height, Religion, Smoking, Drinking.
*   **Photos:**
    *   Upload up to 5 photos.
    *   **AI Nudity Check:** Client-side (TensorFlow/NSFWJS) filtering to prevent inappropriate content immediately upon upload.
    *   **Fallback:** Robust image loading with fallbacks for broken URLs.

### 4.4 User Experience (UX)
*   **Aesthetics:** Premium, serif-heavy typography, "Paper" and "Ink" color palette (Warm whites, Deep greens/blacks, Gold accents).
*   **Navigation:** Simple flow (Home -> Sign Up -> Main Feed/Mailbox).

## 5. Technical Architecture
*   **Frontend:** React (Vite), Tailwind CSS, Lucide Icons.
*   **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
*   **External APIs:** Aladin API (Book Search), NSFWJS (Client-side AI).
*   **Infrastructure:** Node.js Proxy Server (to handle CORS for Aladin API).

## 6. Data Schema
*   `member`: Stores user profile, photos (array), and basic stats.
*   `member_books`: Stores the selected book details (1:N relation, though MVP enforces 1 main book).

## 7. Success Metrics (KPIs)
*   **Conversion Rate:** % of users who complete the 4-step sign-up flow.
*   **Retention:** Day-1 and Day-7 retention rates.
*   **Match Quality:** Average length of conversation after matching (proxy for depth).

## 8. Strategic Decisions (Finalized)

### 8.1 Matching Logic: Daily Curated (Slow Dating)
*   **Mechanism:** Users receive a limited number of high-quality matches (e.g., 3) every day at a specific time (e.g., 10 PM).
*   **Rationale:** Creates a daily ritual and reduces "swipe fatigue". Emphasizes quality over quantity.
*   **Algorithm:** Prioritizes book genre overlap, review sentiment analysis, and lifestyle compatibility.

### 8.2 Interaction Model: Blind Date (Focus on Inner Self)
*   **Mechanism:** Upon matching, profile photos are initially blurred or hidden.
*   **Reveal Condition:** Photos are revealed only after 24 hours of active conversation or after a mutual "Unveil" agreement.
*   **Rationale:** Forces users to connect based on their "Life Book" and conversation first, reducing superficial judgment.

### 8.3 Monetization: Ticket System (Pay-per-Match)
*   **Currency:** "Ink" (Internal currency).
*   **Model:**
    *   Free: Receive daily curated profiles.
    *   Paid (Ink): Required to "Unlock" a match and start a conversation, or to "Extend" a chat beyond 24 hours if the reveal hasn't happened.
*   **Rationale:** High-intent monetization. Users only pay for connections they genuinely want to pursue.
