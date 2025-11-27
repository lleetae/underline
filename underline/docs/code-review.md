# Underline Code Review Report

**Date:** 2025-11-27  
**Reviewer:** AI Code Review  
**Version:** Next.js Migration (v1.0)

---

## Executive Summary

현재 Underline 프로젝트는 Vite에서 Next.js 14로 성공적으로 마이그레이션되었으며, 기본적인 구조와 기능은 잘 구현되어 있습니다. 그러나 **PRD 요구사항** 및 **보안 정책** 대비 몇 가지 중요한 **누락 사항**과 **보안 취약점**이 발견되었습니다.

**전체 평가:** 🟡 **Medium Priority Issues Found**

---

## 1. PRD 요구사항 대비 분석

### ✅ 구현 완료

| 요구사항 | 상태 | 파일 |
|---------|------|------|
| **Next.js + TypeScript** | ✅ 완료 | `tsconfig.json`, `next.config.js` |
| **Supabase 연동** | ✅ 완료 | `app/lib/supabase.ts` |
| **Aladin API Proxy** | ✅ 완료 | `app/api/books/search/route.ts` |
| **회원가입 플로우** | ✅ 완료 | `app/components/SignUpView.tsx` |
| **프로필 시스템** | ✅ 완료 | `app/components/MyProfileView.tsx` |
| **매칭 UI** | ✅ 완료 | `app/components/MailboxView.tsx` |

### 🔴 미구현 / 누락 (Critical)

#### 1.1 **Kakao OAuth 로그인** (PRD 4.1)
```typescript
// ❌ 현재: 로그인 모달만 있고 실제 Kakao OAuth 연동 없음
// 📁 app/components/LoginModal.tsx
```

**Required Action:**
- Supabase Auth Provider에 Kakao 설정
- OAuth 콜백 처리 구현
- State parameter CSRF 검증 (security.md 2.1)

#### 1.2 **결제 시스템** (PRD 5, 8.3)
```typescript
// ❌ 결제 관련 컴포넌트 및 API 없음
// PortOne/Toss Payments 연동 필요
```

**Required Files:**
- `app/api/payment/verify/route.ts` - 결제 검증
- `app/components/PaymentModal.tsx` - 결제 UI
- `app/api/payment/webhook/route.ts` - 결제 콜백

#### 1.3 **주간 배치 로직** (PRD 8.1)
```typescript
// ❌ Weekly Batch 로직 없음
// - 일~목: 등록, 금~토: 매칭, 일요일: 리셋
```

**Required Implementation:**
- Supabase Edge Function or Cron Job
- 매칭 기간 검증 로직
- 신청 소멸 로직

#### 1.4 **사진 Blur/Unveil 시스템** (PRD 8.2)
```typescript
// ❌ 현재: CSS blur만 사용 중 (보안 취약)
// ✅ 필요: 서버 기반 이중 이미지 전략
```

**Security Risk:** 개발자 도구로 원본 URL 확인 가능

**Required Implementation:**
- Blurred thumbnail 생성 로직
- Signed URL 발급 (매칭 성사 시)
- Private Bucket 설정

---

## 2. 보안 정책 대비 분석

### 🔴 Critical Security Issues

#### 2.1 **API 키 노출** (security.md 6.1)

**❌ 하드코딩된 API 키 발견:**
```typescript
// 📁 app/api/books/search/route.ts:3
const ALADIN_API_KEY = 'ttbboookbla1908004';
```

**Risk:** 🔴 **HIGH**  
**Impact:** API 키가 클라이언트 번들에 포함되어 GitHub에 노출됨

**Fix Required:**
```typescript
// ✅ 환경 변수로 이동
const ALADIN_API_KEY = process.env.ALADIN_API_KEY;

if (!ALADIN_API_KEY) {
  throw new Error('ALADIN_API_KEY is not defined');
}
```

**Action Items:**
1. ❌ `.env` 파일에 `ALADIN_API_KEY` 추가
2. ❌ `.env.example` 업데이트
3. ❌ Git 히스토리에서 키 제거 (이미 커밋됨)

#### 2.2 **카카오 ID 평문 저장** (security.md 3.1)

**❌ 암호화 없이 DB 저장:**
```typescript
// 📁 app/components/SignUpView.tsx:62
kakao_id: fullUserData.kakaoId, // ❌ 평문 저장
```

**Risk:** 🔴 **CRITICAL**  
**Impact:** 개인정보 유출 시 즉시 악용 가능

**Required Fix:**
```typescript
// ✅ Supabase Edge Function에서 암호화
// 1. pgcrypto 사용
// 2. 또는 Supabase Vault 활용
```

#### 2.3 **Row Level Security (RLS) 미확인** (security.md 2.2)

**Status:** ⚠️ **UNKNOWN**  
Supabase RLS 정책이 설정되었는지 확인 필요

**Required Checks:**
- [ ] `users` 테이블: 본인 또는 공개 프로필만 조회?
- [ ] `matches` 테이블: 당사자만 조회?
- [ ] `payments` 테이블: Service Role Only?

#### 2.4 **NSFW 이미지 필터링 없음** (PRD 5, security.md 4.2)

```typescript
// ❌ NSFWJS 구현 없음
// ❌ Server-side 검증 없음
```

**Risk:** 🟡 **MEDIUM**  
유해 이미지 업로드 방지 필요

---

## 3. 코드 품질 분석

### ✅ 장점

1. **TypeScript 타입 안정성**
   - 대부분의 컴포넌트에서 적절한 타입 정의
   - Props interface 명확함

2. **컴포넌트 구조**
   - 관심사 분리 잘됨 (signup/, mailbox/)
   - 재사용 가능한 UI 컴포넌트 (`ui/`)

3. **Next.js 마이그레이션**
   - App Router 올바르게 사용
   - API Routes 구조 적절

### ⚠️ 개선 필요

#### 3.1 **클라이언트 컴포넌트 과다 사용**

```typescript
// ❌ 모든 컴포넌트가 'use client'
// ✅ 서버 컴포넌트 활용 가능한 부분 식별 필요
```

**Recommendation:**
- 정적 콘텐츠는 Server Component로
- 인터랙션 필요한 부분만 'use client'

#### 3.2 **에러 처리 부족**

```typescript
// ❌ 에러 경계(Error Boundary) 없음
// ❌ API 실패 시 fallback UI 없음
```

**Required:**
- `app/error.tsx` 생성
- `app/not-found.tsx` 생성
- API 에러 토스트 개선

#### 3.3 **입력값 검증 부족** (security.md 4.1)

```typescript
// ⚠️ 프론트엔드 검증만 존재
// ❌ 백엔드 검증 없음 (SQL Injection 위험)
```

**Required:**
- 서평 길이 제한 (DB 스키마 + API)
- 메시지 길이 제한
- HTML 태그 이스케이프

---

## 4. 누락된 기능 체크리스트

### 핵심 기능 (Must Have)

- [ ] **Kakao OAuth 연동** - 로그인 불가능
- [ ] **결제 시스템** - 수익화 불가능
- [ ] **RLS 정책 설정** - 데이터 무단 접근 가능
- [ ] **카카오 ID 암호화** - 개인정보 유출 위험
- [ ] **API 키 환경변수화** - 현재 GitHub에 노출

### 중요 기능 (Should Have)

- [ ] **주간 배치 로직** - 핵심 비즈니스 로직
- [ ] **Blur/Unveil 시스템** - 차별화 포인트
- [ ] **NSFW 필터링** - 서비스 품질
- [ ] **알림 시스템** - 사용자 경험
- [ ] **Rate Limiting** - DoS 방어

### 권장 기능 (Nice to Have)

- [ ] **무한 스크롤** (리스트 조회)
- [ ] **필터 기능** (나이/지역)
- [ ] **Sorting 로직** (Penalty Logic 포함)
- [ ] **Analytics 연동**

---

## 5. 보안 체크리스트 검증

| 항목 | 상태 | 비고 |
|-----|------|------|
| RLS 정책 검증 | ⚠️ 미확인 | Supabase 대시보드 확인 필요 |
| 환경변수 .gitignore | ✅ 완료 | `.env` 제외됨 |
| 이미지 URL 보안 | ❌ 실패 | 원본 URL 노출됨 |
| 결제 검증 로직 | ❌ 미구현 | 기능 자체 없음 |
| 카카오 ID 암호화 | ❌ 실패 | 평문 저장 |
| 입력값 길이 제한 | ⚠️ 부분 | 프론트만 있음 |

---

## 6. 권장 조치사항

### Immediate (Week 1)

1. **🔴 API 키 보안**
   ```bash
   # .env에 추가
   ALADIN_API_KEY=ttbboookbla1908004
   
   # 코드 수정
   const ALADIN_API_KEY = process.env.ALADIN_API_KEY;
   ```

2. **🔴 카카오 ID 암호화**
   - Supabase Edge Function 생성
   - pgcrypto 설정
   - 회원가입 플로우 수정

3. **🔴 RLS 정책 설정**
   - Supabase SQL Editor에서 정책 생성
   - 테스트 쿼리로 검증

### Short-term (Week 2-3)

4. **Kakao OAuth 연동**
5. **결제 시스템 구현**
6. **Blur/Unveil 시스템**
7. **주간 배치 로직**

### Medium-term (Month 1)

8. NSFW 필터링
9. 알림 시스템
10. Rate Limiting

---

## 7. 코드 개선 제안

### 7.1 API Routes 개선

```typescript
// ❌ Before: app/api/books/search/route.ts
const ALADIN_API_KEY = 'ttbboookbla1908004';

// ✅ After:
if (!process.env.ALADIN_API_KEY) {
  return NextResponse.json(
    { error: 'Server configuration error' },
    { status: 500 }
  );
}
```

### 7.2 Supabase Client 개선

```typescript
// ✅ app/lib/supabase.ts는 양호
// 추가 권장: Server-side Client 분리

// app/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Server-only
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### 7.3 Error Boundary 추가

```typescript
// app/error.tsx
'use client';

export default function Error({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>문제가 발생했습니다</h2>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

---

## 8. 다음 단계 (Next Steps)

1. **즉시 수정** (이번 주)
   - API 키 환경변수화
   - Git 히스토리에서 민감 정보 제거
   - RLS 정책 확인 및 설정

2. **우선순위 개발** (2주)
   - Kakao OAuth
   - 카카오 ID 암호화
   - 결제 시스템 기본 구조

3. **기능 완성** (1개월)
   - Blur/Unveil
   - 주간 배치
   - NSFW 필터링

---

## 9. 결론

Underline 프로젝트는 **기술 스택과 기본 구조는 탄탄**하지만, **보안 및 핵심 비즈니스 로직**에서 중요한 누락이 있습니다.

**Critical Issues (빨간불 🔴):**
1. API 키 노출
2. 카카오 ID 평문 저장
3. OAuth 미구현
4. 결제 시스템 미구현

이러한 이슈들은 **서비스 출시 전 반드시 해결**되어야 하며, 특히 보안 관련 항목은 **즉시 조치**가 필요합니다.

**Recommendation:** 🟡 → 🟢로 전환하기 위해 2-3주의 집중 개발 필요
