# frontend-repo

신용 평가 AI 규제준수 자동감사 플랫폼 (프론트엔드 레포)

## 기술 스택

| 영역            | 선택                           | 선택이유                                                                         |
| --------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| 빌드 도구       | Vite                           | CRA는 유지보수 종료됨. 빠른 dev 서버/HMR                                     |
| 언어            | TypeScript                     | 타입 안정성                                                                  |
| UI 프레임워크   | React 19                       |                                                                              |
| UI 라이브러리   | Ant Design                     | 테이블/필터/폼 등 관리자·감사 대시보드 화면에 강함, 국내 현업 채택 비중 높음 |
| 라우팅          | React Router                   |                                                                              |
| 서버 상태       | TanStack Query                 | API 캐싱/재조회/로딩·에러 상태 관리                                          |
| 클라이언트 상태 | Zustand                        | Redux 대비 보일러플레이트 적음                                               |
| 폼              | React Hook Form + Zod          | 스키마 기반 검증 (규제 룰 검증 로직과 궁합 좋음)                             |
| HTTP 클라이언트 | Axios                          | interceptor로 JWT 토큰 갱신/에러 처리                                        |
| 인증            | JWT (Access/Refresh)           |                                                                              |
| 린트/포맷       | ESLint(flat config) + Prettier |                                                                              |

## 폴더 구조 (Feature-Sliced Design)

```
src/
├── app/                        # 앱 전역 설정 레이어
│   ├── providers/               # Router, QueryClient, Antd ConfigProvider 등 전역 프로바이더
│   └── styles/                  # 전역 CSS
│
├── pages/                      # 라우트 단위 화면 레이어
│   └── home/                    # "home" 페이지 슬라이스
│       └── ui/                   # 페이지 컴포넌트 (HomePage.tsx 등)
│
├── widgets/                    # 여러 feature/entity를 조합한 복합 UI 블록 레이어
│   └── layout/                  # "layout" 위젯 슬라이스 (헤더/사이드바 등 전체 레이아웃)
│       └── ui/                   # 레이아웃 컴포넌트
│
├── features/                   # 사용자 인터랙션 단위 기능 레이어
│   └── auth/                    # "auth" 기능 슬라이스 (로그인 등)
│       ├── ui/                   # 폼/버튼 등 UI 컴포넌트
│       ├── model/                # 상태, 훅, 타입 (예: zustand store)
│       └── api/                  # 이 기능 전용 API 호출 함수
│
├── entities/                   # 도메인 모델 레이어
│   └── user/                    # "user" 엔티티 슬라이스
│       └── model/                # User 타입, 관련 상태/로직
│
└── shared/                     # 공통 코드 레이어 (다른 모든 레이어가 참조 가능)
    ├── api/                      # axios 인스턴스, react-query client 등 공통 API 설정
    ├── config/                   # 환경변수 등 앱 설정
    ├── lib/
    │   └── hooks/                 # 공통 커스텀 훅
    ├── types/                    # 공통 타입 정의
    └── ui/                       # 공통 UI 컴포넌트 (버튼 래퍼 등)
```

레이어 간 import는 **위에서 아래 방향으로만** 허용됩니다 (`app → pages → widgets → features → entities → shared`).
예를 들어 `entities`는 `features`를 import할 수 없고, `shared`는 다른 어떤 레이어도 import할 수 없습니다.
이 규칙은 `eslint-plugin-boundaries`로 강제되며, 위반 시 `npm run lint`에서 에러로 잡힙니다.

### 슬라이스 내부 하위 폴더 규칙

각 레이어의 슬라이스(예: `features/auth`, `entities/user`)는 필요에 따라 아래 하위 폴더를 가집니다.

| 하위 폴더 | 용도                                        |
| --------- | ------------------------------------------- |
| `ui/`     | 컴포넌트 (JSX)                              |
| `model/`  | 상태(store), 타입, 비즈니스 로직, 커스텀 훅 |
| `api/`    | 서버 통신 함수 (axios 호출, react-query 훅) |

현재는 각 슬라이스에 폴더 뼈대만 있고(`.gitkeep`) 실제 구현은 비어 있는 상태입니다. `pages`, `widgets`, `entities`, `features`는 기능이 추가될 때마다 새 슬라이스 폴더(`pages/report`, `entities/audit-rule` 등)를 그 옆에 만들어가는 구조입니다.

경로는 alias로 import합니다 (상대경로 `../../..` 대신):

```ts
import { useAuthStore } from '@entities/user';
import { AppLayout } from '@widgets/layout';
```

## 시작하기

```bash
cp .env.example .env   # VITE_API_BASE_URL 등 환경변수 설정
npm install
npm run dev
```

## 스크립트

| 명령                   | 설명                           |
| ---------------------- | ------------------------------ |
| `npm run dev`          | 개발 서버 실행                 |
| `npm run build`        | 타입체크 + 프로덕션 빌드       |
| `npm run typecheck`    | 타입체크만 실행                |
| `npm run lint`         | ESLint 검사 (레이어 규칙 포함) |
| `npm run format`       | Prettier로 전체 포맷팅         |
| `npm run format:check` | 포맷 검사만 (CI용)             |

## 협업 규칙

### PR / 머지 규칙

- `main`, `develop` 브랜치에는 직접 push하지 않는다.
- 모든 변경 사항은 작업 브랜치에서 개발한 후 PR을 생성한다.
- 다른 팀원 1명 이상의 승인을 받아야 병합할 수 있다.
- 병합 완료 후 작업 브랜치는 삭제한다.

### 브랜치 전략

- `main`, `develop` 두 브랜치만 상시 운영한다.
- `main`에는 직접 push하지 않는다 (릴리즈 시에만 `develop → main` 병합).
- `develop`이 default 브랜치이며, 모든 작업 브랜치는 `develop`에서 분기하고 `develop`으로 병합한다.

### 브랜치 네이밍 규칙

`타입/#이슈번호-기능설명` 형식을 사용한다. (예: `feat/#22-model-upload`)

| 타입       | 설명                         |
| ---------- | ---------------------------- |
| `feat`     | 새로운 기능 개발             |
| `fix`      | 오류 수정                    |
| `refactor` | 기능 변경 없는 코드 개선     |
| `style`    | 코드 포맷, 들여쓰기 등 수정  |
| `chore`    | 환경설정                     |
| `infra`    | Docker, AWS, CI/CD 등 인프라 |
| `test`     | 테스트                       |
| `docs`     | 문서 작성 및 수정            |

### 커밋 메시지 컨벤션

형식: `[타입/#이슈번호] 메시지`

- 메시지는 모호하지 않고 상세하게 작성한다.
  - 좋은 예: `[fix/#155] 잘못된 비밀번호 입력 시 예외 응답 오류 수정`
  - 안좋은 예: `[fix/#155] 로그인 수정`
- 하나의 커밋엔 하나의 작업만 담는다.
  - 좋은 예: `[feat/#132] 모델 업로드 API 추가`
  - 안좋은 예: `[feat/#132] 모델 업로드 API 추가 및 로그인 오류 수정 및 CSS 변경`
- 제목 끝에 마침표를 붙이지 않는다.
  - 좋은 예: `[feat/#132] 비밀번호 입력 오류 수정`
  - 안좋은 예: `feat/#132: 비밀번호 입력 오류 수정.`
- 명사체로 작성한다.
  - 좋은 예: `[feat/#132] 비밀번호 입력 오류 수정`
  - 안좋은 예: `[feat/#132] 비밀번호 입력 오류 수정합니다.`

### API prefix 규칙

`/api/**` 형태로 데이터 요청 경로임을 명확히 구분한다. 시스템 관리와 업데이트를 쉽게 하기 위한 목적이다.

- `/api`: API 요청 경로임을 명시
- `/auth`: 인증 관련 기능
- `/login`: 세부 작업

규칙:

- 리소스명은 복수 명사를 사용한다.
- 동사 사용을 금지한다.
- 단어 구분이 필요하면 하이픈(`-`)을 사용한다.
