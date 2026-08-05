# frontend-repo

신용평가 AI 규제준수 자동감사 플랫폼 (프론트엔드 레포)

React + TypeScript로 만든 **사용자용 웹 애플리케이션**입니다. 모델 업로드부터 감사 실행, 규제 자가점검, 보고서 다운로드, 이의제기 대응, 운영 대시보드까지 전 과정을 화면으로 제공합니다.

> 이 레포는 화면과 상태만 담당합니다. 실제 계산·판정·AI 분석은 전부 `backend-repo`(Spring)가 처리하고, 프론트는 그 결과를 REST API로 받아 그리기만 합니다.

<br>

## 목차

1. [기술 스택](#1-기술-스택)
2. [아키텍처 — 다른 서버와의 관계](#2-아키텍처--다른-서버와의-관계)
3. [이 레포의 역할](#3-이-레포의-역할)
4. [패키지 구조 (Feature-Sliced Design)](#4-패키지-구조-feature-sliced-design)
5. [주요 기능 / 라우트](#5-주요-기능--라우트)
6. [어필 포인트](#6-어필-포인트)
7. [시작하기](#7-시작하기)
8. [스크립트](#8-스크립트)
9. [테스트 방법](#9-테스트-방법)
10. [협업 규칙](#10-협업-규칙)

<br>

---

## 1. 기술 스택

| 영역 | 선택 | 선택 이유 |
|---|---|---|
| 빌드 도구 | Vite | CRA는 유지보수 종료됨. 빠른 dev 서버 / HMR |
| 언어 | TypeScript | 타입 안정성 — 백엔드 응답 스키마와 1:1로 맞춰 계약을 코드로 강제 |
| UI 프레임워크 | React 19 | |
| UI 라이브러리 | Ant Design | 테이블 · 필터 · 폼 등 관리자·감사 대시보드 화면에 강함, 국내 현업 채택 비중 높음 |
| 라우팅 | React Router | |
| 서버 상태 | TanStack Query | API 캐싱 / 재조회 / 로딩·에러 상태 관리 |
| 클라이언트 상태 | Zustand | Redux 대비 보일러플레이트 적음 |
| 폼 | React Hook Form + Zod | 스키마 기반 검증 (규제 자가점검 같은 룰 검증 로직과 궁합 좋음) |
| HTTP 클라이언트 | Axios | interceptor로 JWT 토큰 첨부 · 에러 메시지 정규화 |
| 인증 | JWT (Access / Refresh) | |
| 린트 / 포맷 | ESLint(flat config) + Prettier | `eslint-plugin-boundaries`로 레이어 규칙까지 정적으로 강제 |

<br>

---

## 2. 아키텍처 — 다른 서버와의 관계
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/3a5c9e58-d68e-45de-b1ca-dfe34577da64" />

**프론트엔드는 백엔드하고만 이야기합니다.** 공정성·설명가능성 분석이나 리포트 생성 같은 실제 AI 작업은 백엔드가 `ai-repo`를 호출해서 처리하고, 프론트는 그 결과가 반영된 백엔드 응답만 받습니다. 이 레포 어디에도 AI 서버 주소나 호출 코드는 없습니다.

<br>

### 공통 API 클라이언트 (`src/shared/api/client.ts`)

- 모든 요청은 `apiClient`(axios 인스턴스) 하나를 거칩니다. `baseURL`은 `.env`의 `VITE_API_BASE_URL` 하나로 관리하므로, 로컬/스테이징/운영 전환이 환경변수만 바꾸면 끝납니다.
- 요청 인터셉터가 저장된 access token을 `Authorization: Bearer ...` 헤더로 자동으로 붙입니다. 기능 코드에서 토큰을 직접 다루는 곳은 없습니다.
- `extractApiErrorMessage()`가 백엔드 `GlobalExceptionHandler`의 공통 에러 포맷(`{ code, message }`)에서 실제 원인 메시지를 꺼내줍니다. axios가 만드는 제네릭 문구("Request failed with status code 500")를 그대로 노출하지 않습니다.

<br>

### 인증 흐름 (JWT Access / Refresh)

- **Access token은 어디에도 저장하지 않습니다.** `client.ts`의 모듈 변수(메모리)에만 잠깐 머물다가 새로고침하면 사라집니다 — XSS로 로컬스토리지가 털려도 access token은 노출되지 않습니다.
- Refresh token만 "로그인 유지" 여부에 따라 `localStorage`(유지) 또는 `sessionStorage`(세션 한정)에 저장합니다.
- 앱이 처음 뜰 때 `AuthInitializer`가 저장된 refresh token으로 `/auth/reissue`를 호출해 access token을 다시 발급받고 세션을 복원합니다. refresh token이 없거나 만료됐으면 로그아웃 상태로 시작합니다.

<br>

### API 요청 경로 컨벤션

`/api/v1/**` 형태로 통일합니다 (백엔드 `AuthController` 등 실제 컨트롤러 prefix와 일치). 리소스명은 복수 명사, 동사 금지, 단어 구분은 하이픈(`-`)만 사용합니다.

<br>

---

## 3. 이 레포의 역할

> **한 문장으로:** 신용평가 모델의 감사 전 과정 — 사전진단 → 모델 업로드/감사 실행 → 규제 자가점검 → 보고서 확인 → 이의제기 대응 → 운영 모니터링 — 을 한 화면 흐름으로 이어주는 웹 클라이언트입니다.

<br>

홈 화면(`/features`)에 노출되는 5대 핵심 기능(`src/shared/config/coreFeatures.ts`)이 이 레포가 제공하는 가치를 요약합니다.

| 기능 | 설명 |
|---|---|
| ① 고영향 AI 사전진단 | 업로드한 모델이 "고영향 AI"에 해당하는지 사전 판단 |
| ② 신뢰성 검증 · 규제대응 | AI 기본법 조항 충족 여부를 자동으로 감사 |
| ③ 산출물(보고서) 자동 생성 | 설명가능성 · 공정성 진단 보고서 등 산출물을 자동 생성 |
| ④ 이의제기 대응문서 | 고객 이의제기에 대한 대응 의견 초안 작성 |
| ⑤ 운영 대시보드 | 최종 산출 결과를 대시보드로 모니터링 |

이 외에 로그인 · 회원가입 · 비밀번호 재설정(인증), 감사 결과 기반 질의응답 챗봇, 사내 게시판, 마이페이지, 알림 기능도 함께 제공합니다.

<br>

---

## 4. 패키지 구조 (Feature-Sliced Design)

```text
src/
├── app/                # 앱 전역 설정 레이어
│   ├── providers/        # Router, QueryClient 등 전역 프로바이더
│   └── styles/            # 전역 CSS
│
├── pages/              # 라우트 단위 화면 레이어
│   └── home/              # "home" 페이지 슬라이스
│       └── ui/              # 페이지 컴포넌트 (HomePage.tsx 등)
│
├── widgets/            # 여러 feature/entity를 조합한 복합 UI 블록 레이어
│   └── layout/            # "layout" 위젯 슬라이스 (헤더/사이드바 등 전체 레이아웃)
│       └── ui/
│
├── features/           # 사용자 인터랙션 단위 기능 레이어
│   └── auth/              # "auth" 기능 슬라이스 (로그인 등)
│       ├── ui/              # 폼/버튼 등 UI 컴포넌트
│       ├── model/            # 상태, 훅, 타입 (zustand store 등)
│       └── api/               # 이 기능 전용 API 호출 함수
│
├── entities/           # 도메인 모델 레이어
│   └── user/              # "user" 엔티티 슬라이스
│       └── model/            # User 타입, 관련 상태/로직
│
└── shared/             # 공통 코드 레이어 (다른 모든 레이어가 참조 가능)
    ├── api/                # apiClient(axios), 헬스체크 등 공통 API 설정
    ├── config/              # 5대 핵심 기능 정의 등 앱 설정
    ├── lib/hooks/            # 공통 커스텀 훅
    ├── types/                # 공통 타입 정의
    └── ui/                   # 공통 UI 컴포넌트
```

<br>

### 레이어 규칙

import는 **위에서 아래 방향으로만** 허용됩니다:

```text
app → pages → widgets → features → entities → shared
```

예를 들어 `entities`는 `features`를 import할 수 없고, `shared`는 다른 어떤 레이어도 import할 수 없습니다. 이 규칙은 사람이 리뷰로 잡는 게 아니라 `eslint-plugin-boundaries`가 강제하며, 위반하면 `npm run lint`가 그 자리에서 에러로 잡아냅니다.

<br>

### 슬라이스 내부 하위 폴더

| 하위 폴더 | 용도 |
|---|---|
| `ui/` | 컴포넌트 (JSX) |
| `model/` | 상태(store), 타입, 비즈니스 로직, 커스텀 훅 |
| `api/` | 서버 통신 함수 (axios 호출, react-query 훅) |

<br>

새 기능이 필요하면 해당 레이어 아래에 새 슬라이스 폴더(`pages/report`, `entities/audit-rule` 등)를 그 옆에 만들어가는 구조입니다. 경로는 상대경로(`../../..`) 대신 alias로 import합니다:

```ts
import { useAuthStore } from '@entities/user';
import { AppLayout } from '@widgets/layout';
```

<br>

---

## 5. 주요 기능 / 라우트

### 인증

| 라우트 | 화면 |
|---|---|
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/find-password` | 비밀번호 찾기 |
| `/reset-password` | 새 비밀번호 설정 |

<br>

### 핵심 감사 플로우

| 라우트 | 화면 |
|---|---|
| `/pre-diagnosis` | 고영향 AI 사전진단 |
| `/audit` | STEP2 — 모델 · 감사 데이터 업로드 |
| `/audit/:auditId` | STEP3 — 분석 진행 상황 확인 + 규제 자가점검(21문항) 동시 진행 |
| `/audit/:auditId/results` | STEP4 — 공정성 · 설명가능성 결과물 및 보고서 다운로드 |

<br>

### 이의제기 · 대시보드 · 기타

| 라우트 | 화면 |
|---|---|
| `/objections` | 이의제기 목록 |
| `/objections/:objectionId/document` | 이의제기 대응문서 |
| `/dashboard` | AI 운영 모니터링 대시보드 |
| `/board` | 사내 게시판 (목록 / 작성 / 상세 / 수정) |
| `/my-page` | 마이페이지 |

감사 실행(`POST /audits`)은 202로 즉시 응답하는 비동기 작업이라, 완료될 때까지 짧은 간격으로 재조회하는 폴링 함수(`waitForAuditCompletion`, `waitForRegulationMappings`)로 진행 상황을 이어받습니다. 감사 결과 화면에서는 근거 기반 질의응답 챗봇 위젯(`widgets/chatbot`)도 함께 붙습니다.

<br>

---

## 6. 어필 포인트

**1) FSD 레이어 규칙을 리뷰가 아니라 ESLint로 강제합니다.**
`app → pages → widgets → features → entities → shared` 단방향 의존 규칙을 `eslint-plugin-boundaries`로 정의해, 역방향 import는 사람이 놓쳐도 `npm run lint`(그리고 CI)에서 반드시 걸립니다.

**2) Access token을 어떤 저장소에도 남기지 않습니다.**
메모리에만 유지되는 access token과 달리 refresh token만 `localStorage`/`sessionStorage`에 저장하고, 부팅 시 재발급으로 세션을 복원합니다. XSS로 스토리지가 노출되어도 즉시 쓸 수 있는 access token은 없습니다.

**3) 백엔드 에러를 사용자에게 있는 그대로 전달합니다.**
`extractApiErrorMessage()`가 axios의 제네릭 에러 문구 대신 백엔드 `GlobalExceptionHandler`가 내려준 실제 원인 메시지를 뽑아 보여줘서, "무슨 에러인지 알 수 없는" UX를 피합니다.

**4) 비동기 감사 파이프라인을 타임아웃 있는 폴링으로 안전하게 기다립니다.**
감사 실행과 규제 매핑 생성은 모두 202/비동기 처리라, 무한 대기 대신 제한 시간을 둔 폴링과 전용 타임아웃 에러(`RegulationMappingTimeoutError`)로 "실제로 없는 것"과 "아직 안 끝난 것"을 구분합니다.

**5) API 응답 타입을 백엔드 스키마와 1:1로 맞췄습니다.**
`FairlearnMetricCode`, `ShapMetricCode`, `RegulationComplianceStatus` 등 백엔드가 내려주는 enum·상태값을 TypeScript 유니온 타입으로 그대로 옮겨, 오타나 스펙 불일치를 컴파일 타임에 잡습니다.

**6) Ant Design + TanStack Query 조합으로 관리자형 화면을 빠르게 구현합니다.**
감사 대시보드처럼 테이블 · 필터 · 폼이 많은 화면에 강한 Ant Design과, 서버 상태 캐싱·재조회·로딩/에러 처리를 표준화하는 TanStack Query를 함께 써서 화면마다 반복되는 로딩/에러 처리 코드를 줄입니다.

**7) API 경로·브랜치·커밋 컨벤션을 문서로 고정했습니다.**
`/api/v1/**` 리소스 네이밍부터 브랜치 네이밍(`타입/#이슈번호-설명`), 커밋 메시지 형식까지 팀 컨벤션을 README에 명시해 팀원 누구나 같은 규칙으로 작업합니다.

<br>

---

## 7. 시작하기

```bash
git clone <repository-url>
cd frontend-repo

cp .env.example .env   # VITE_API_BASE_URL, VITE_RECAPTCHA_SITE_KEY 값 채우기
npm install
npm run dev
```

개발 서버가 뜨면 기본적으로 `http://localhost:5173`에서 접속할 수 있습니다. 백엔드(`backend-repo`)가 `.env`의 `VITE_API_BASE_URL`(기본 `http://localhost:8080/api/v1`)에서 먼저 떠 있어야 로그인을 포함한 대부분의 화면이 정상 동작합니다.

> `VITE_RECAPTCHA_SITE_KEY`는 로그인/회원가입에 쓰이는 reCAPTCHA 사이트 키입니다. 발급받은 키를 채우지 않으면 해당 화면에서 인증에 실패합니다.

<br>

---

## 8. 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm run typecheck` | 타입체크만 실행 |
| `npm run lint` | ESLint 검사 (FSD 레이어 규칙 포함) |
| `npm run format` | Prettier로 전체 포맷팅 |
| `npm run format:check` | 포맷 검사만 (CI용) |

<br>

---

## 9. 테스트 방법

이 레포에는 아직 별도의 자동화 테스트 스위트(Vitest/Jest 등)가 없습니다. 대신 아래 세 가지가 최소한의 안전망 역할을 합니다.

```bash
npm run typecheck   # 타입 오류 확인 — 백엔드 응답 스키마와 어긋난 곳을 여기서 대부분 잡습니다
npm run lint         # ESLint + FSD 레이어 규칙 위반 확인
npm run build         # 위 둘을 통과해야 실제로 빌드까지 됩니다
```

기능이 실제로 동작하는지는 다음 순서로 수동 확인합니다.

1. `backend-repo`를 먼저 띄웁니다(기본 `:8080`).
2. `npm run dev`로 프론트를 띄우고, 아무 화면이나 열어 네트워크 탭에서 API 요청이 401/CORS 에러 없이 응답을 받는지부터 확인합니다. `shared/api/health.ts`의 `getHealth()`를 임시로 호출해 `/health` 응답을 직접 찍어봐도 됩니다.
3. 확인하려는 라우트로 직접 이동해 화면을 확인합니다 — 예를 들어 감사 플로우를 바꿨다면 `/pre-diagnosis` → `/audit` → `/audit/:auditId` → `/audit/:auditId/results` 순서로 실제로 밟아봅니다.
4. 로그인이 필요한 화면은 `/login`에서 로그인한 뒤, "로그인 유지" 체크박스를 켜고/끄고 새로고침해 access token 재발급(`AuthInitializer`)이 의도대로 동작하는지 함께 확인합니다.

<br>

---

## 10. 협업 규칙

### PR / 머지 규칙

- `main`, `develop` 브랜치에는 직접 push하지 않는다.
- 모든 변경 사항은 작업 브랜치에서 개발한 후 PR을 생성한다.
- 다른 팀원 1명 이상의 승인을 받아야 병합할 수 있다.
- 병합 완료 후 작업 브랜치는 삭제한다.

<br>

### 브랜치 전략

- `main`, `develop` 두 브랜치만 상시 운영한다.
- `main`에는 직접 push하지 않는다 (릴리즈 시에만 `develop → main` 병합).
- `develop`이 default 브랜치이며, 모든 작업 브랜치는 `develop`에서 분기하고 `develop`으로 병합한다.

<br>

### 브랜치 네이밍 규칙

`타입/#이슈번호-기능설명` 형식을 사용한다. (예: `feat/#22-model-upload`)

| 타입 | 설명 |
|---|---|
| `feat` | 새로운 기능 개발 |
| `fix` | 오류 수정 |
| `refactor` | 기능 변경 없는 코드 개선 |
| `style` | 코드 포맷, 들여쓰기 등 수정 |
| `chore` | 환경설정 |
| `infra` | Docker, AWS, CI/CD 등 인프라 |
| `test` | 테스트 |
| `docs` | 문서 작성 및 수정 |

<br>

### 커밋 메시지 컨벤션

형식: `[타입/#이슈번호] 메시지`

- 메시지는 모호하지 않고 상세하게 작성한다.
  - 좋은 예: `[fix/#155] 잘못된 비밀번호 입력 시 예외 응답 오류 수정`
  - 안좋은 예: `[fix/#155] 로그인 수정`
- 하나의 커밋엔 하나의 작업만 담는다.
  - 좋은 예: `[feat/#132] 모델 업로드 API 추가`
  - 안좋은 예: `[feat/#132] 모델 업로드 API 추가 및 로그인 오류 수정 및 CSS 변경`
- 제목 끝에 마침표를 붙이지 않는다.
- 명사체로 작성한다.
  - 좋은 예: `[feat/#132] 비밀번호 입력 오류 수정`
  - 안좋은 예: `[feat/#132] 비밀번호 입력 오류 수정합니다.`

<br>

### API prefix 규칙

`/api/**` 형태로 데이터 요청 경로임을 명확히 구분한다. 시스템 관리와 업데이트를 쉽게 하기 위한 목적이다.

- `/api`: API 요청 경로임을 명시
- `/auth`: 인증 관련 기능
- `/login`: 세부 작업

규칙:

- 리소스명은 복수 명사를 사용한다.
- 동사 사용을 금지한다.
- 단어 구분이 필요하면 하이픈(`-`)을 사용한다.
