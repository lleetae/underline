# Underline(언더라인) Web Security Architecture & Policy

## 1. 개요 (Overview)

본 문서는 프리미엄 주간 소개팅 서비스 Underline의 보안 아키텍처 및 정책을 기술합니다. 사용자의 민감한 개인정보(사진, 카카오톡 ID)와 가치관이 담긴 서평 데이터를 보호하고, 안전한 결제 및 매칭 환경을 제공하는 것을 목적으로 합니다.

- **Version:** 1.0
- **Target Scope:** Web Client (Next.js), BaaS (Supabase), External APIs (Aladin, PortOne, Kakao)

---

## 2. 인증 및 권한 관리 (Authentication & Authorization)

### 2.1 인증 (Authentication)

**Kakao OAuth 2.0 (OpenID Connect):**
- Supabase Auth를 통한 카카오 로그인 연동.
- **State Parameter Check:** CSRF(Cross-Site Request Forgery) 공격 방지를 위해 OAuth 요청 시 state 값을 검증.
- **Token Management:** Access Token과 Refresh Token은 클라이언트의 HttpOnly 쿠키 또는 Secure Storage에 저장하여 XSS(Cross-Site Scripting) 공격으로 인한 토큰 탈취 방지.

### 2.2 권한 제어 (Authorization via RLS)

Supabase(PostgreSQL)의 **RLS(Row Level Security)**를 사용하여 데이터베이스 레벨에서 엄격한 접근 제어를 수행합니다.

| Table | Policy (Rule) | Description |
|-------|---------------|-------------|
| **users** | SELECT | 본인 데이터 OR 매칭 알고리즘에 의해 필터링된 공개 프로필만 조회 가능. |
| **users** | UPDATE | `auth.uid() == id` (본인만 수정 가능). |
| **matches** | SELECT | `auth.uid() == requester_id` OR `auth.uid() == receiver_id` (당사자만 조회). |
| **matches** | INSERT | 인증된 사용자만 신청 가능. |
| **books** | SELECT | public (모든 사용자 조회 가능). |
| **payments** | ALL | Service Role (Server-side) Only. 클라이언트 직접 접근 차단. |

---

## 3. 데이터 보안 및 프라이버시 (Data Security & Privacy)

### 3.1 민감 정보 암호화 (PII Protection)

매칭 성사 시 교환되는 카카오톡 ID는 가장 민감한 정보이므로 평문 저장을 금지합니다.

**Encryption at Rest (저장 시 암호화):**
- Supabase의 `pgcrypto` 확장 모듈을 사용하여 카카오톡 ID를 **AES-256** 알고리즘으로 암호화하여 DB에 저장.
- 또는 **Supabase Vault**를 활용하여 별도 키 관리.
- 복호화 키는 환경 변수(Environment Variable)로 관리하며 코드베이스에 노출 금지.

**Decryption Logic:**
- 클라이언트(프론트엔드)에서 직접 복호화하지 않음.
- 결제 검증이 완료된 후, **Supabase Edge Function**을 통해서만 복호화된 ID를 클라이언트로 전송.

### 3.2 이미지 프라이버시 (Blur to Unveil Architecture)

프론트엔드 CSS `backdrop-filter: blur` 처리는 개발자 도구로 원본 URL 확인이 가능하므로 보안상 불완전합니다. 따라서 **이중 이미지 전략**을 사용합니다.

**Public/Locked State:**
- 서버(Edge Function) 또는 업로드 시점에서 생성된 **저해상도 블러 썸네일(Blurred Thumbnail)**만 클라이언트에 전송.

**Unveiled State:**
- 매칭 성사(수락) 로직이 DB에 커밋된 경우에만 원본 이미지의 **Signed URL(유효기간이 있는 URL)**을 발급하여 제공.
- Supabase Storage의 Bucket Policy를 Private으로 설정하여 URL 추측 공격 방지.

---

## 4. 콘텐츠 보안 및 무결성 (Content Security & Integrity)

### 4.1 사용자 입력 데이터 검증 (Input Validation)

- **XSS 방지:** 서평(Review) 및 첫인사 메시지 작성 시 HTML 태그 입력을 이스케이프(Escape) 처리하거나, React의 기본 XSS 방어 기능을 활용.
- **SQL Injection 방지:** Supabase Client SDK 사용 시 자동으로 파라미터화된 쿼리가 실행되므로 별도 조치 불필요 (단, `rpc` 호출 시 주의).

### 4.2 유해 이미지 차단 (NSFW)

- **Client-side:** PRD에 명시된 **NSFWJS**를 사용하여 업로드 전 1차 필터링.
- **Server-side (권장):** 클라이언트 검증은 우회 가능하므로, Supabase Edge Function을 통해 업로드 트리거(Trigger) 시점에 이미지를 분석하거나, 신뢰할 수 없는 이미지는 `pending` 상태로 두고 관리자 승인 후 `public` 전환.

---

## 5. 결제 시스템 보안 (Payment Security)

### 5.1 결제 검증 (Verification)

클라이언트에서 결제 성공 콜백을 받더라도, 이를 신뢰하여 즉시 로직을 수행하면 안 됩니다.

1. **Client:** PortOne 결제 성공 → 서버(Next.js API Route / Edge Function)로 `imp_uid`, `merchant_uid` 전송.
2. **Server:** PortOne REST API를 호출하여 실제 결제 내역과 금액이 일치하는지 검증 (Cross-Check).
   - 결제 금액이 9,900 또는 14,900원과 정확히 일치하는지 확인.
3. **Process:** 검증 완료 시에만 DB의 `payments` 테이블 기록 및 상대방 카카오 ID 공개 로직 수행.

### 5.2 "골든벨" 로직 보안

**Atomic Transaction:**
- "한 명이 결제하면 양쪽 모두 공개" 로직은 동시성 이슈가 발생할 수 있음.
- 데이터베이스 트랜잭션을 사용하여 결제 상태 업데이트와 연락처 공개 권한 부여가 원자적(Atomic)으로 수행되도록 보장.

---

## 6. 인프라 및 API 보안 (Infrastructure & API Security)

### 6.1 API Key 관리

- **Aladin API Key:** 클라이언트 번들(Client Bundle)에 포함 금지. Next.js API Route를 Proxy로 사용하여 서버 사이드에서만 알라딘 API 호출.
- **Supabase Anon Key:** 공개되어도 무방하나 RLS 정책이 완벽해야 함.
- **Supabase Service Role Key:** 절대 클라이언트에 노출 금지 (환경 변수로만 관리).

### 6.2 Rate Limiting (속도 제한)

- **DoS 방지:** Vercel의 기본 DDoS 방어 활용.
- **Abuse 방지:** Upstash(Redis) 등을 활용하여 특정 IP에서의 과도한 프로필 조회나 매칭 신청 요청(Spamming)을 제한.

### 6.3 CORS 정책

- `Access-Control-Allow-Origin`을 자사 도메인으로 엄격하게 제한하여 타 사이트에서의 API 무단 호출 방지.

---

## 7. 보안 체크리스트 (Developer Checklist)

- [ ] **RLS 정책 검증:** 모든 테이블에 RLS가 활성화(Enable)되어 있는가?
- [ ] **환경변수 점검:** `.env` 파일이 git에 커밋되지 않았는가?
- [ ] **이미지 경로:** `users` 테이블 조회 시 원본 이미지 URL이 노출되지 않고 있는가?
- [ ] **결제 위변조:** 결제 금액 검증 로직이 백엔드(Serverless Function)에 구현되었는가?
- [ ] **카카오 ID:** DB 저장 시 암호화되어 저장되는가?
- [ ] **입력값 길이 제한:** DB 스키마 및 프론트엔드에서 텍스트 길이 제한이 적용되었는가? (DDoS/DB부하 방지)

---

## 8. 참고 문서

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PortOne 결제 검증 가이드](https://portone.gitbook.io/docs/)
