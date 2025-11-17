import { NextResponse } from 'next/server';
import { query } from '@/lib/database';
import fs from 'fs';
import path from 'path';

// 데이터베이스 초기화 API
export async function POST() {
  try {
    console.log('🔄 데이터베이스 초기화 시작...');
    
    // 스키마 파일 읽기
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // 시드 파일 읽기
    const seedPath = path.join(process.cwd(), 'database', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // 스키마 실행
    console.log('📋 스키마 생성 중...');
    await query(schemaSQL);
    
    // 시드 데이터 삽입
    console.log('🌱 시드 데이터 삽입 중...');
    await query(seedSQL);
    
    console.log('✅ 데이터베이스 초기화 완료');
    
    return NextResponse.json({
      success: true,
      message: '데이터베이스가 성공적으로 초기화되었습니다.'
    });
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '데이터베이스 초기화에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
