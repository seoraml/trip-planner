# 개발환경

## 프론트엔드
- React 19 + TypeScript(strict) + Vite 8
- Tailwind CSS v4 (`@tailwindcss/vite`)
- shadcn/ui (레지스트리 기반 — 소스를 직접 복사해서 씀, npm 라이브러리 아님) + Radix UI + lucide-react 아이콘
- react-router (플레인 `<Routes>`, data router 아님) — 라우트 4개: `/`, `/trip/new`, `/trip/:shareSlug`
- 폴더 구조: 업무 패키지 코드 기준 도메인별 분리
  - `trp` 여행(Trip), `itn` 일정(Itinerary), `plc` 장소(Place), `usr` 사용자(User/Auth)

## 백엔드 / DB
- Supabase (Postgres + Auth + Row Level Security + Storage)
- 인증
  - 익명 세션(`signInAnonymously`)이 기본값
  - 구글 로그인 시 `linkIdentity`로 기존 데이터 유지하며 실사용자 계정으로 승격
  - 여행 생성은 실제 로그인(구글) 사용자만 가능하도록 제한 (익명 세션으로 만든 여행이 나중에 계정과 안 이어지는 문제 방지)
- 권한
  - `owner_id` 기반 RLS — 소유자만 수정/삭제 가능
  - `is_public = true`면 공유 링크로 누구나 조회 가능 (로그인 불필요, 수정은 불가)
- Storage: `trip-thumbnails` 버킷 — 여행 대표 사진

## 지도
- Google Maps JavaScript API + Places API + Directions API (키 1개로 전부 사용)
- `MapProvider` 인터페이스로 지도 구현체를 추상화 — 다른 지도 서비스로 교체 가능하게 설계
  (원래 카카오맵으로 시작했다가 구글 지도로 교체한 이력 있음)
- Directions API로 Day별 도보/차량 실제 이동 경로 및 소요시간 표시

## 배포
- Vercel — git 연동 자동 배포
- `vercel.json`에 SPA 라우팅용 rewrite 설정 (클라이언트 라우팅 딥링크 404 방지)

## 기타 도구
- 린트: oxlint
- QR 코드: `qrcode.react` (공유 다이얼로그용)

## 주요 패키지 버전
| 패키지 | 버전 |
|---|---|
| react / react-dom | ^19.2.7 |
| vite | ^8.1.1 |
| typescript | ~6.0.2 |
| tailwindcss | ^4.3.3 |
| @supabase/supabase-js | ^2.111.0 |
| react-router | ^8.3.0 |
| oxlint | ^1.71.0 |
