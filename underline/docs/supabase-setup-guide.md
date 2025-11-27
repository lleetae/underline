# Supabase Security Setup Guide

본 문서는 Underline 프로젝트의 Supabase 보안 설정을 위한 단계별 가이드입니다.

## 📋 Prerequisites

- Supabase 프로젝트 생성 완료
- Supabase 대시보드 접근 권한
- `member`, `books`, `matches`, `payments` 테이블 생성 완료

---

## 1. Row Level Security (RLS) 설정

### Step 1: SQL Editor 접근

1. Supabase 대시보드 로그인
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 버튼 클릭

### Step 2: RLS 정책 실행

`docs/supabase-security-setup.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣고 실행합니다.

```sql
-- 파일 전체 내용을 한 번에 실행하거나,
-- 섹션별로 나누어 실행 가능합니다
```

### Step 3: RLS 활성화 확인

SQL Editor에서 실행:

```sql
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('member', 'books', 'matches', 'payments');
```

**Expected Result:**
| tablename | rowsecurity |
|-----------|-------------|
| member    | t           |
| books     | t           |
| matches   | t           |
| payments  | t           |

---

## 2. Kakao ID 암호화 설정

### Step 1: 암호화 키 생성

터미널에서 실행:

```bash
openssl rand -base64 32
```

**Output 예시:**
```
Kq7X9pL2Nm4Rt8Vw1Yz3Cd5Fh6Jk7Mn
```

이 키를 안전하게 보관하세요!

### Step 2: Supabase Vault 설정

1. Supabase 대시보드 → **Settings** → **Vault**
2. **Add new secret** 클릭
3. 정보 입력:
   - **Name:** `kakao_encryption_key`
   - **Secret:** (Step 1에서 생성한 키)
4. **Save** 클릭

### Step 3: 암호화 함수 업데이트

SQL Editor에서 함수 업데이트:

```sql
-- Function to encrypt Kakao ID (Updated)
CREATE OR REPLACE FUNCTION encrypt_kakao_id(kakao_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key from Vault
  encryption_key := current_setting('app.settings.kakao_encryption_key', true);
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  
  RETURN encode(
    pgp_sym_encrypt(
      kakao_id,
      encryption_key,
      'cipher-algo=aes256'
    ),
    'base64'
  );
END;
$$;

-- Function to decrypt Kakao ID (Updated)
CREATE OR REPLACE FUNCTION decrypt_kakao_id(encrypted_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key from Vault
  encryption_key := current_setting('app.settings.kakao_encryption_key', true);
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    encryption_key,
    'cipher-algo=aes256'
  );
END;
$$;
```

### Step 4: 암호화 테스트

```sql
-- Test encryption
SELECT encrypt_kakao_id('test_kakao_id_123');

-- Test decryption
SELECT decrypt_kakao_id(encrypt_kakao_id('test_kakao_id_123'));
-- Should return: 'test_kakao_id_123'
```

---

## 3. Service Role Key 설정

### Step 1: Service Role Key 복사

1. Supabase 대시보드 → **Settings** → **API**
2. **Service Role Key** 섹션에서 키 복사 (⚠️ **절대 GitHub에 커밋하지 마세요!**)

### Step 2: 환경 변수 설정

**로컬 개발:**

`.env` 파일에 추가:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Vercel 배포:**

1. Vercel 대시보드 → **Settings** → **Environment Variables**
2. 변수 추가:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (Service Role Key 붙여넣기)
   - **Environment:** Production, Preview, Development 모두 체크
3. **Save** 클릭

---

## 4. 주간 배치 로직 (Weekly Batch)

### Step 1: 매칭 기간 체크 함수

```sql
-- Function to check if current time is in matching period (Friday-Saturday)
CREATE OR REPLACE FUNCTION is_matching_period()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Friday (5) or Saturday (6)
  RETURN EXTRACT(DOW FROM NOW()) IN (5, 6);
END;
$$;
```

### Step 2: RLS 정책 업데이트

```sql
-- Update: Users can only view profiles during matching period
DROP POLICY IF EXISTS "Users can view matching profiles" ON member;

CREATE POLICY "Users can view matching profiles"
ON member
FOR SELECT
USING (
  -- Allow viewing own profile anytime
  auth.uid() = id
  OR
  -- Allow viewing other profiles only during matching period
  is_matching_period()
);
```

### Step 3: Cron Job 설정 (주간 리셋)

Supabase Dashboard → **Database** → **Cron Jobs** (pg_cron)

```sql
-- Run every Sunday at 00:00 (KST 09:00)
SELECT cron.schedule(
  'weekly-reset',
  '0 0 * * 0',  -- Sunday at midnight UTC (09:00 KST)
  $$
  -- Archive expired match requests
  UPDATE matches
  SET status = 'expired'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '7 days';
  $$
);
```

---

## 5. 검증 체크리스트

### ✅ RLS 정책

- [ ] `member` 테이블 RLS 활성화
- [ ] `books` 테이블 RLS 활성화
- [ ] `matches` 테이블 RLS 활성화
- [ ] `payments` 테이블 RLS 활성화
- [ ] 사용자가 자신의 데이터만 수정 가능한지 테스트
- [ ] 다른 사용자의 민감 정보 접근 불가 테스트

### ✅ 암호화

- [ ] pgcrypto 확장 활성화
- [ ] Vault에 암호화 키 저장
- [ ] `encrypt_kakao_id()` 함수 생성
- [ ] `decrypt_kakao_id()` 함수 생성
- [ ] 암호화/복호화 테스트 성공

### ✅ 환경 변수

- [ ] `SUPABASE_SERVICE_ROLE_KEY` 로컬 `.env`에 추가
- [ ] Vercel 환경 변수에 `SUPABASE_SERVICE_ROLE_KEY` 추가
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인

### ✅ API Routes

- [ ] `/api/encrypt/kakao` 엔드포인트 작동 확인
- [ ] Service Role Key로 Supabase RPC 호출 성공

---

## 6. 트러블슈팅

### Issue: "Encryption key not configured"

**Solution:**
1. Supabase Vault에 `kakao_encryption_key` 저장 확인
2. SQL 함수에서 올바른 설정 이름 사용 확인
3. Supabase 프로젝트 재시작 (Settings → General → Restart Project)

### Issue: "RLS policy prevents access"

**Solution:**
1. SQL Editor에서 정책 확인:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'member';
   ```
2. 정책 로직 검증
3. 필요시 정책 수정 후 재실행

### Issue: "Service role key invalid"

**Solution:**
1. Supabase API 페이지에서 Service Role Key 재확인
2. 환경 변수에 복사 붙여넣기 시 공백/줄바꿈 없는지 확인
3. Next.js 개발 서버 재시작

---

## 7. 보안 Best Practices

1. **절대 Git에 커밋하지 말 것:**
   - Service Role Key
   - 암호화 키
   - 실제 사용자 데이터

2. **환경 변수 보호:**
   - `.env` 파일을 `.gitignore`에 추가
   - Vercel 환경 변수는 팀원과 안전하게 공유
   - Production/Development 환경 분리

3. **정기적인 키 로테이션:**
   - 암호화 키 6개월마다 갱신 권장
   - 갱신 시 기존 데이터 재암호화 필요

4. **접근 로그 모니터링:**
   - Supabase Logs 탭에서 이상 접근 감시
   - RLS 정책 우회 시도 탐지

---

## 8. Next Steps

이 설정이 완료되면:

1. **회원가입 테스트:**
   - 새 사용자 등록
   - DB에서 kakao_id가 암호화되어 저장되는지 확인

2. **매칭 플로우 테스트:**
   - RLS 정책이 올바르게 작동하는지 확인
   - 주간 매칭 기간 체크

3. **결제 시스템 구현:**
   - PortOne 연동
   - 결제 성공 시 복호화된 Kakao ID 제공

4. **Production 배포:**
   - Vercel 환경 변수 설정 확인
   - Supabase Production 환경 검증
   - 보안 체크리스트 재검증

---

## 참고 문서

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Vault](https://supabase.com/docs/guides/database/vault)
- [PostgreSQL pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
