import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { WorkRequest } from '@/types';

// GET - 업무 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터에서 필터 조건 추출
    const 회사 = searchParams.get('회사');
    const 디자이너배정 = searchParams.get('디자이너');
    const 진행상태 = searchParams.get('진행상태');
    const 요청일시작 = searchParams.get('요청일시작');
    const 요청일종료 = searchParams.get('요청일종료');

    // 기본 쿼리
    let sql = `
      SELECT * FROM work_requests 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // 동적 WHERE 조건 추가
    if (회사) {
      sql += ` AND 회사 = $${paramIndex}`;
      params.push(회사);
      paramIndex++;
    }

    if (디자이너배정) {
      sql += ` AND 디자이너배정 = $${paramIndex}`;
      params.push(디자이너배정);
      paramIndex++;
    }

    if (진행상태) {
      sql += ` AND 진행상태 = $${paramIndex}`;
      params.push(진행상태);
      paramIndex++;
    }

    if (요청일시작) {
      sql += ` AND 요청일 >= $${paramIndex}`;
      params.push(요청일시작);
      paramIndex++;
    }

    if (요청일종료) {
      sql += ` AND 요청일 <= $${paramIndex}`;
      params.push(요청일종료);
      paramIndex++;
    }

    // 정렬
    sql += ` ORDER BY 요청일 DESC, id DESC`;

    const result = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });

  } catch (error) {
    console.error('업무 요청 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST - 새로운 업무 요청 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      번호, 분사명, 회사, 요청일, 원료보정일, 담당MD, 요청자,
      업무명, 요청내용, 작업상황, 요청자URL, 메모, 진행상태,
      신청요청_디자인시작일, 신청요청_디자인완료일, 디자이너배정, 검수완료, 공수
    } = body;

    // 필수 필드 검증
    if (!번호 || !회사 || !요청일 || !요청자 || !업무명) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO work_requests (
        번호, 분사명, 회사, 요청일, 원료보정일, 담당MD, 요청자,
        업무명, 요청내용, 작업상황, 요청자URL, 메모, 진행상태,
        신청요청_디자인시작일, 신청요청_디자인완료일, 디자이너배정, 검수완료, 공수
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `;

    const params = [
      번호, 분사명, 회사, 요청일, 원료보정일, 담당MD, 요청자,
      업무명, 요청내용, 작업상황, 요청자URL, 메모, 진행상태 || '대기',
      신청요청_디자인시작일, 신청요청_디자인완료일, 디자이너배정, 검수완료 || 0, 공수 || 0
    ];

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('업무 요청 생성 에러:', error);
    
    // 중복 번호 에러 처리
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 번호입니다.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: '업무 요청 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
