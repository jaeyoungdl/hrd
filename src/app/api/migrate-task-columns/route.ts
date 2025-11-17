import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const migrationSqlPath = path.join(process.cwd(), 'database', 'add-task-columns.sql');
    const migrationSql = await fs.readFile(migrationSqlPath, 'utf-8');

    // 트랜잭션으로 실행하여 모든 변경이 성공하거나 모두 롤백되도록 함
    await query('BEGIN');
    await query(migrationSql);
    await query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'tasks 테이블에 priority와 completed_at 컬럼이 성공적으로 추가되었습니다.'
    });
  } catch (error) {
    await query('ROLLBACK'); // 에러 발생 시 롤백
    console.error('tasks 테이블 컬럼 추가 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'tasks 테이블 컬럼 추가에 실패했습니다.', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
