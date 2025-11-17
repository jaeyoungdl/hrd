import { Pool } from 'pg';

// 데이터베이스 연결 설정
const pool = new Pool({
  user: process.env.DATABASE_USER || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'hrd_management',
  password: process.env.DATABASE_PASSWORD || 'password',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  // SSL 설정 (외부 서버용)
  ssl: false, // SSL 완전 비활성화
  // 연결 풀 설정
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
  connectionTimeoutMillis: 10000, // 연결 타임아웃 증가
});

// 데이터베이스 연결 테스트
export const testConnection = async () => {
  try {
    console.log('🔍 데이터베이스 연결 정보:', {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD ? '***설정됨***' : '설정되지 않음'
    });
    
    const client = await pool.connect();
    console.log('✅ 데이터베이스 연결 성공');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    return false;
  }
};

// 쿼리 실행 헬퍼 함수
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('쿼리 실행:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('쿼리 실행 에러:', error);
    throw error;
  }
};

// 트랜잭션 실행 헬퍼 함수
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
