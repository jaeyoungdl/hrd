-- 업무관리시스템 데이터베이스 초기화 스크립트

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'designer', 'user')),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 업무 요청 테이블
CREATE TABLE IF NOT EXISTS work_requests (
    id SERIAL PRIMARY KEY,
    번호 VARCHAR(50) UNIQUE NOT NULL,
    분사명 VARCHAR(100),
    회사 VARCHAR(100) NOT NULL,
    요청일 DATE NOT NULL,
    원료보정일 DATE,
    담당MD VARCHAR(100),
    요청자 VARCHAR(100) NOT NULL,
    업무명 TEXT NOT NULL,
    요청내용 TEXT,
    작업상황 TEXT,
    요청자URL TEXT,
    메모 TEXT,
    진행상태 VARCHAR(20) DEFAULT '대기' CHECK (진행상태 IN ('대기', '진행중', '검수완료', '완료', '취소')),
    신청요청_디자인시작일 DATE,
    신청요청_디자인완료일 DATE,
    디자이너배정 VARCHAR(100),
    검수완료 DECIMAL(3,1) DEFAULT 0,
    공수 DECIMAL(4,1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_work_requests_company ON work_requests(회사);
CREATE INDEX IF NOT EXISTS idx_work_requests_status ON work_requests(진행상태);
CREATE INDEX IF NOT EXISTS idx_work_requests_designer ON work_requests(디자이너배정);
CREATE INDEX IF NOT EXISTS idx_work_requests_date ON work_requests(요청일);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_requests_updated_at ON work_requests;
CREATE TRIGGER update_work_requests_updated_at
    BEFORE UPDATE ON work_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 기본 관리자 계정 생성 (비밀번호: admin123)
INSERT INTO users (email, name, password_hash, role) 
VALUES ('admin@example.com', '관리자', '$2b$10$x4K3vL9aQOcWf1/2P5G8qO.rN6tJ8sM9wV5hX3yZ7bA1cE4fD2gH6', 'admin')
ON CONFLICT (email) DO NOTHING;
