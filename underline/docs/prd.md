# Product Requirements Document (PRD): Underline

## 1. Product Overview
* **Product Name:** Underline (언더라인)
* **One-Liner:** 나를 만든 '책'을 매개로 깊은 대화를 시작하는 프리미엄 주간 소개팅 서비스.
* **Vision:** 표면적인 스waipe와 가벼운 만남을 넘어, 문학적 취향과 가치관의 공명을 통해 진정성 있는 관계를 연결한다. "행간을 읽고, 당신의 밑줄(Underline)을 찾으세요."

## 2. Problem Statement
1.  **피상성 (Superficiality):** 외모와 스펙 위주의 기존 앱은 사람의 고유한 분위기나 깊이를 보여주지 못함.
2.  **자기표현의 한계:** 내면이 알찬 사람들이 사진 몇 장으로 자신을 증명해야 하는 불합리함.
3.  **대화의 단절:** "안녕하세요" 이상의 깊이 있는 대화를 시작할 공통의 매개체(Ice-breaker) 부재.
4.  **만남의 피로도:** 상시 열려있는 매칭 시스템과 가벼운 관계에 대한 피로감 누적.

## 3. Target Audience
* **Primary:** 독서를 즐기며, 지적인 교류와 가치관이 맞는 만남을 추구하는 2030 남녀.
* **User Persona:**
    * 자신의 취향을 기록하고 전시하는 것을 즐기는 사람.
    * 가벼운 만남 앱에 지쳐, 일주일에 한 번이라도 진지한 기회를 갖고 싶은 사람.

## 4. Key Features & User Flow

### 4.1 Onboarding & Auth
* **Kakao Login:** 카카오톡 로그인을 통한 빠른 가입 (OpenID Connect).
* **MVP Constraint:** 가입 이탈을 최소화하기 위해 **"인생 책 1권 + 서평"** 작성만으로 가입 완료.
* **Contact Info:** 매칭 성사 시 교환할 카카오톡 ID 필수 수집 (암호화 저장).

### 4.2 The "Library" Profile (Dual Value Proposition)
프로필은 단순 정보 페이지가 아닌, 사용자의 지적 정체성을 담은 **'서재(Bookshelf)'**로 정의됨.

1.  **Self-Archiving (나를 위한 기록):**
    * 가입 후 도서/서평을 **무제한 추가** 가능.
    * 내가 읽은 책들이 쌓이는 시각적 만족감 제공 (지적 자부심 충족).
2.  **Social Discovery (타인을 위한 전시):**
    * 상대방은 책 리스트를 통해 취향과 관심사를 파악.
    * **서평(Review)**을 통해 상대의 문체, 생각의 깊이, 가치관을 탐색.

### 4.3 Weekly Matching Flow
* **Apply:** 사용자는 일~목요일 사이에 이번 주 소개팅 참가를 신청.
* **Browsing (Message Request):**
    * 신청자 전체 리스트 열람 (Open List).
    * 마음에 드는 상대에게 **"짧은 첫인사(Short Greeting)"**와 함께 신청.
* **Interaction:** 매칭 수락 시 사진 공개 (Blur -> Unveil).

### 4.4 UI Color Palette (현재 적용)
* Background: `#FAFAFA` (Off White), 필요 시 `#EAEAEA`–`#F0F0F0` 연회색 필로 카드/배경 보조.
* Text: `#171717`(헤더·헤비), `#333333`(본문).
* Border/Divider/Disabled: `#C2C2C2`.
* Accent: `#CC0000` (주요 버튼/뱃지), Hover/Dark: `#b30000`.
* Selection: `rgba(204, 0, 0, 0.15)` 배경 + `#171717` 텍스트.
* Guideline: 포인트는 CTA/뱃지/중요 아이콘에만 제한적으로 사용, 나머지는 모노톤으로 컨텐츠 가독성에 집중.

## 5. Functional Specifications

| Feature | Description | Requirement |
| :--- | :--- | :--- |
| **Book Search** | 알라딘 API 연동 도서 검색 | 제목, 저자, 커버 이미지, 카테고리(장르) 파싱 |
| **Writing** | 서평 작성 에디터 | 최소 글자 수 제한, 줄바꿈 지원 |
| **Photo Upload** | 프로필 사진 등록 | **NSFWJS (Client-side AI)**로 유해 이미지 즉시 차단 |
| **Listing** | 이성 리스트 조회 | 무한 스크롤, 필터(나이/지역), 정렬 로직 적용 |
| **Chat/Msg** | 매칭 신청 메시지 | 텍스트 입력 (글자수 제한), 이모지 지원 |
| **Payment** | PG사 결제 연동 | PortOne/Toss Payments, 결제 검증 로직 |
| **Notification** | 알림 시스템 | 매칭 신청 수신, 매칭 성공, 연락처 공개 시 알림 |

## 6. Technical Architecture

### 6.1 Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide Icons.
* **Backend (BaaS):** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
* **Deployment:** Vercel (Frontend & Serverless Functions).
* **External APIs:** Aladin API (Books), PortOne (Payment).

### 6.2 Data Schema (Core)
* `users`: 기본 정보, Kakao ID, 크레딧 정보.
* `books`: 사용자가 등록한 책 메타데이터, 서평, 등록일.
* `matches`: 신청자(`requester`), 수신자(`receiver`), 상태(`pending`, `accepted`, `rejected`), **첫인사 메시지(`message`)**.
* `payments`: 결제 ID, 결제 금액, 결제자, 대상 매칭 ID.

## 7. Key Performance Indicators (KPIs)
1.  **Conversion Rate:** 가입 플로우(인생책 1권 등록) 완료율.
2.  **Weekly Retention:** 주간 소개팅 재신청 비율 (핵심 리텐션 지표).
3.  **Books per User:** 유저당 평균 등록 도서 수 (아카이빙 기능 활성도 측정).
4.  **Match Success Rate:** (매칭 수락 건수 / 전체 신청 건수) * 100.
5.  **Paying Conversion:** (연락처 공개 결제 건수 / 성사된 매칭 건수) * 100.

## 8. Strategic Decisions & Rules

### 8.1 Weekly Batch Logic (Slow Dating)
* **Operating Cycle:**
    * **Registration:** 일요일 ~ 목요일 (참가 신청 기간).
    * **Active Matching:** 금요일 ~ 토요일 (리스트 공개 및 매칭 진행).
    * **Reset:** 일요일 (지난주 데이터 초기화 및 신규 회차 시작).
* **Sorting Algorithm:**
    * 기본적으로 최신순/활동순 정렬.
    * **Penalty Logic:** 지난 회차에서 이미 매칭되었던 유저는 리스트 **최하단**으로 배치하여 중복 노출 피로도 감소.
* **Expiration:** 받은 신청(메시지 포함)은 매칭 기간(금~토) 종료 시 자동 소멸.

### 8.2 Interaction Policy (Blur to Unveil)
* **Default State:** 리스트 및 상세화면에서 사진 **블러(Blur)** 처리 (내면 집중).
* **Unveil Trigger:**
    1.  A가 첫인사 메시지와 함께 신청.
    2.  B가 수락.
    3.  **수락 즉시 양쪽 모두에게 사진 원본 공개.**

### 8.3 Monetization Strategy (Golden Bell)
* **Revenue Model:** Pay-per-contact (건당 과금).
* **Mechanism:** 매칭 성사 후, 둘 중 **한 명이라도 결제하면 양쪽 모두에게** 연락처(Kakao ID) 공개.
* **Pricing:**
    * **Early Bird:** 9,900 KRW.
    * **Regular:** 14,900 KRW.
