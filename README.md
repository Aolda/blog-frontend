# Aolda Blog Frontend

아올다 블로그의 블로깅 관리 콘솔 프론트엔드입니다.

로그인, 글 템플릿 생성, 임시저장, 이미지 업로드/삭제, 프로필 수정 기능을 제공합니다.

## 주요 기능

- 이메일/비밀번호 로그인 + Google OAuth 로그인
- 글 작성용 MDX 템플릿 생성 (`/posts/template`)
- 자동/수동 임시저장 (브라우저 `localStorage`)
- 이미지 업로드/삭제 및 마크다운 링크 복사
- 내 프로필 조회/수정

## 기술 스택

- React 19 + TypeScript + Vite
- TanStack Router (file-based routing)
- TanStack Query
- TailwindCSS v4 + shadcn/ui
- Axios
- Sonner (toast)

## 시작하기

### 1) 요구사항

- Node.js 20+
- pnpm

### 2) 설치

```bash
pnpm install
```

### 3) 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 설정하세요.

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_DEV_AUTH=false
```

- `VITE_API_BASE_URL`: 백엔드 API 기본 주소입니다. 미설정 시 `http://localhost:8000/api/v1`를 사용합니다.
- `VITE_DEV_AUTH`: `true`면 개발용 더미 사용자로 인증을 우회합니다.

### 4) 개발 서버 실행

```bash
pnpm dev
```

기본 포트는 `1234`입니다.

## 스크립트

| 명령어         | 설명                     |
| -------------- | ------------------------ |
| `pnpm dev`     | 개발 서버 실행 (`:1234`) |
| `pnpm build`   | 프로덕션 빌드            |
| `pnpm preview` | 빌드 결과 미리보기       |
| `pnpm test`    | Vitest 테스트 실행       |

## 라우트

| 경로               | 설명                                     |
| ------------------ | ---------------------------------------- |
| `/`                | 랜딩 또는 로그인 사용자 대시보드         |
| `/login`           | 이메일/Google 로그인                     |
| `/auth/callback`   | Google 기존 사용자 로그인 콜백 처리      |
| `/register/google` | Google 신규 사용자 회원가입 완료         |
| `/write`           | 글 작성, 임시저장, 미리보기, 이미지 패널 |
| `/drafts`          | 임시저장 글 목록/삭제/이어서 작성        |
| `/images`          | 이미지 업로드/삭제, URL/마크다운 복사    |
| `/profile`         | 내 프로필 조회/수정                      |

## 상태 및 저장소 동작

- 인증 토큰 저장: `localStorage`의 `access_token`, `refresh_token` 키를 사용합니다.
- 401 응답 처리: Axios 인터셉터가 `refresh_token`으로 자동 갱신을 시도합니다.
- 임시저장: `localStorage`의 `blog-drafts` 키에 저장합니다.
- 이미지 목록 UI 상태: `sessionStorage`의 `uploaded-images` 키에 저장합니다.

## API 문서

백엔드 API 상세 명세는 아래 파일을 참고하세요.

- `API_SPEC.md`

## 프로젝트 구조

```text
src/
  routes/         # TanStack Router 파일 기반 라우트
  components/     # 공용 컴포넌트
  components/ui/  # shadcn/ui 프리미티브
  contexts/       # AuthContext
  lib/            # API 클라이언트, 쿼리, 인증, 임시저장 유틸
  types/          # 타입 정의
```
