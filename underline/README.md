# Underline (언더라인)

> 책으로 시작하는 프리미엄 주간 소개팅 서비스

## 🎯 About

Underline은 독서를 즐기며 지적인 교류를 추구하는 2030 남녀를 위한 프리미엄 소개팅 플랫폼입니다. 가벼운 스와이프를 넘어, 문학적 취향과 가치관의 공명을 통해 진정성 있는 관계를 연결합니다.

**"행간을 읽고, 당신의 밑줄(Underline)을 찾으세요."**

## 🚀 Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide Icons
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel
- **APIs:** Aladin (Books), PortOne (Payment), Kakao (OAuth)

## 📁 Project Structure

```
underline/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes (Serverless Functions)
│   │   └── books/           # Book search & details
│   ├── components/          # React Components
│   │   ├── ui/             # UI Component Library
│   │   ├── mailbox/        # Mailbox features
│   │   └── signup/         # Sign-up flow
│   ├── lib/                # Utilities
│   │   └── supabase.ts     # Supabase client
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── public/                  # Static assets
├── prd.md                  # Product Requirements
├── security.md             # Security Policy
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind config
└── tsconfig.json           # TypeScript config
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/lleetae/underline.git
cd underline

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔐 Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `.env.example` for details.

## 📚 Key Features

- **Library Profile:** 사용자의 독서 이력과 서평을 담은 개인 서재
- **Weekly Batch Matching:** 주간 단위로 운영되는 프리미엄 매칭 시스템
- **Blur to Unveil:** 매칭 성사 시 사진 공개로 내면 중심의 만남 유도
- **Book Search:** 알라딘 API 연동 도서 검색
- **Secure Payment:** PortOne 결제 시스템 연동

## 🔒 Security

본 프로젝트는 사용자 데이터 보호를 최우선으로 합니다:
- Row Level Security (RLS) 적용
- 민감 정보 암호화 저장
- 결제 검증 로직 구현
- NSFW 이미지 필터링

자세한 내용은 [security.md](./security.md)를 참고하세요.

## 📖 Documentation

- [PRD (Product Requirements)](./docs/prd.md)
- [Security Policy](./docs/security.md)
- [Walkthrough](/.gemini/antigravity/brain/*/walkthrough.md)

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set environment variables
4. Deploy!

Vercel automatically detects Next.js configuration.

## 📝 License

Copyright © 2024 Underline. All rights reserved.

## 👥 Team

Built with ❤️ by the Underline team

---

**Note:** This is a Next.js 14 project using App Router. The project was migrated from Vite + React for better deployment experience and AI development support.