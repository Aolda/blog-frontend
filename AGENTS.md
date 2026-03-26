# Blog Frontend (Aolda Blog Console)

## Commands

- `pnpm dev` - 개발 서버 실행 (https://abs.localhost)
- `pnpm build` - 프로덕션 빌드
- `pnpm preview` - 빌드 미리보기
- `pnpm test` - 테스트 실행 (vitest)

## Tech Stack

- React 19, TypeScript, Vite
- TanStack Router (file-based routing)
- TanStack Query (server state management)
- TailwindCSS v4, shadcn/ui (new-york style)
- Axios (API client)
- Sonner (toast notifications)

## Project Structure

- `src/routes/` - File-based routes (TanStack Router)
- `src/components/` - Shared components
- `src/components/ui/` - shadcn/ui components
- `src/contexts/` - React contexts (AuthContext)
- `src/lib/` - Utilities (api client, auth, queries)
- `src/types/` - TypeScript type definitions

## Conventions

- Korean UI labels
- `@/` path alias maps to `src/`
- Use shadcn/ui components for UI primitives
- Use `toast` from `sonner` for notifications
- API base URL: `VITE_API_BASE_URL` env variable (default: `http://localhost:8000/api/v1`)
