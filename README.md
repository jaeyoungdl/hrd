# 업무관리시스템 (Work Request Management System)

Next.js 기반의 디자인 업무 요청 관리 시스템입니다.

## 기능

- 디자인 업무 요청 등록 및 관리
- 진행 상태 추적 (대기, 진행중, 검수완료, 완료, 취소)
- 회사별, 디자이너별 필터링
- 실시간 통계 대시보드
- CSV 내보내기

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **인증**: NextAuth.js

## 설치 및 실행

### 1. 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

\`\`\`env
# 데이터베이스 설정
DATABASE_URL=postgresql://username:password@localhost:5432/hrd_system

# NextAuth.js 설정
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# 추가 환경변수
NODE_ENV=development
\`\`\`

### 2. 데이터베이스 설정

PostgreSQL 데이터베이스에 접속하여 `src/lib/init-db.sql` 파일을 실행하세요:

\`\`\`bash
psql -U username -d hrd_system -f src/lib/init-db.sql
\`\`\`

### 3. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 4. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

\`\`\`
src/
├── app/                 # Next.js App Router
├── components/          # 재사용 가능한 컴포넌트
├── lib/                # 유틸리티 함수 및 설정
├── types/              # TypeScript 타입 정의
└── hooks/              # 커스텀 React 훅
\`\`\`

## 주요 기능

### 업무 요청 관리
- 새로운 디자인 요청 등록
- 요청 상태 업데이트
- 디자이너 배정
- 공수 및 진행률 추적

### 필터링 및 검색
- 회사별 필터링
- 디자이너별 필터링
- 날짜 범위 필터링
- 진행 상태별 필터링

### 통계 대시보드
- 실시간 요청 통계
- 진행 상태별 요약
- 월별/일별 요청 현황

## 개발 가이드

### 새로운 기능 추가
1. `src/types/index.ts`에 필요한 타입 정의
2. API 라우트 구현 (`src/app/api/`)
3. 컴포넌트 구현 (`src/components/`)
4. 페이지 구현 (`src/app/`)

### 데이터베이스 스키마 변경
1. `src/lib/init-db.sql` 파일 수정
2. 마이그레이션 스크립트 작성
3. TypeScript 타입 업데이트

## 라이센스

MIT License