# 데이터베이스 설정 가이드

## 1. PostgreSQL 설치 및 설정

### Windows
1. [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 다운로드
2. 설치 시 비밀번호 설정 (기억해두세요!)
3. 기본 포트 5432 사용

### macOS
```bash
# Homebrew 사용
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 2. 데이터베이스 생성

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE hrd_management;

# 사용자 생성 (선택사항)
CREATE USER hrd_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hrd_management TO hrd_user;

# 종료
\q
```

## 3. 스키마 및 데이터 생성

```bash
# 스키마 생성
psql -U postgres -d hrd_management -f database/schema.sql

# 샘플 데이터 삽입
psql -U postgres -d hrd_management -f database/seed.sql
```

## 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 데이터베이스 설정
DATABASE_HOST=fu-it.com
DATABASE_PORT=59993
DATABASE_NAME=hrd_management
DATABASE_USER=fuit
DATABASE_PASSWORD=hello_fuit1325!@#

# Next.js 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

## 5. 연결 테스트

개발 서버를 실행한 후 다음 URL로 데이터베이스 연결을 테스트할 수 있습니다:

```
http://localhost:3000/api/test-db
```

성공하면 다음과 같은 응답을 받습니다:

```json
{
  "success": true,
  "message": "데이터베이스 연결 성공",
  "timestamp": "2025-01-27T..."
}
```

## 6. API 엔드포인트

- `GET /api/projects` - 프로젝트 목록 조회
- `GET /api/tasks` - Task 목록 조회
- `GET /api/stats` - 통계 데이터 조회
- `GET /api/test-db` - 데이터베이스 연결 테스트

## 7. 문제 해결

### 연결 실패 시
1. PostgreSQL 서비스가 실행 중인지 확인
2. 방화벽 설정 확인
3. 환경 변수 값 확인
4. 데이터베이스가 존재하는지 확인

### 권한 오류 시
```sql
-- 사용자에게 권한 부여
GRANT ALL PRIVILEGES ON DATABASE hrd_management TO your_username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;
```
