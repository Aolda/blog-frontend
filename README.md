# Aolda Blog Frontend

아올다 블로그 운영을 위한 관리자 콘솔 프론트엔드입니다.  
작성자는 이 콘솔에서 로그인하고, 게시글을 작성하거나 수정하고, 이미지와 프로필 정보를 관리할 수 있습니다.

## Feature

- 이메일/비밀번호 로그인
- Google OAuth 로그인 및 가입 완료 플로우
- 새 게시글 작성 및 기존 게시글 수정
- 게시글용 이미지 업로드/삭제 및 본문 삽입
- 게시글 목록 조회
- 구성원 목록 조회
- 프로필 및 소셜 링크 수정

## Tech Stack

- React 19
- TypeScript
- Vite
- Portless
- TanStack Router
- TanStack Query
- Tailwind CSS v4 + shadcn/ui
- Axios

## Getting Started

### Requirements

- Node.js 20+
- pnpm
- Portless

### Install

```bash
pnpm install
```

### Environment Variables

프로젝트 루트에 `.env` 파일을 생성하세요.

```bash
VITE_API_BASE_URL=https://blog-api.aoldacloud.com/api/v1
```

- `VITE_API_BASE_URL`: 백엔드 API 기본 주소
- 미설정 시 기본값 `http://localhost:8000/api/v1` 사용

### Run Dev Server

```bash
pnpm dev
```

## Scripts

| Command             | Description        |
| ------------------- | ------------------ |
| `pnpm dev`          | 개발 서버 실행     |
| `pnpm build`        | 프로덕션 빌드      |
| `pnpm preview`      | 빌드 결과 미리보기 |
| `pnpm test`         | 테스트 실행        |
| `pnpm format`       | 코드 포맷 적용     |
| `pnpm format:check` | 코드 포맷 검사     |

## Main Routes

| Route               | Description                         |
| ------------------- | ----------------------------------- |
| `/`                 | 랜딩 페이지 또는 로그인 후 대시보드 |
| `/login`            | 로그인                              |
| `/auth/callback`    | OAuth 콜백 처리                     |
| `/register/google`  | Google 가입 완료                    |
| `/write`            | 새 게시글 작성                      |
| `/write?postId=:id` | 기존 게시글 수정                    |
| `/posts`            | 게시글 목록                         |
| `/members`          | 구성원 목록                         |
| `/profile`          | 프로필 수정                         |

## Project Structure

```text
src/
  components/     공용 컴포넌트
  components/ui/  UI 프리미티브
  contexts/       전역 컨텍스트
  lib/            API 클라이언트, 쿼리, 유틸리티
  routes/         파일 기반 라우트
  types/          타입 정의
```
