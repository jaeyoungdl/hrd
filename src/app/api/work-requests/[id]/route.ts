import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 특정 업무 요청 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sql = 'SELECT * FROM work_requests WHERE id = $1';
    const result = await query(sql, [parseInt(id)]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: '업무 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('업무 요청 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT - 업무 요청 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      분사명, 회사, 요청일, 원료보정일, 담당MD, 요청자,
      업무명, 요청내용, 작업상황, 요청자URL, 메모, 진행상태,
      신청요청_디자인시작일, 신청요청_디자인완료일, 디자이너배정, 검수완료, 공수
    } = body;

    const sql = `
      UPDATE work_requests SET
        분사명 = $1, 회사 = $2, 요청일 = $3, 원료보정일 = $4, 담당MD = $5,
        요청자 = $6, 업무명 = $7, 요청내용 = $8, 작업상황 = $9, 요청자URL = $10,
        메모 = $11, 진행상태 = $12, 신청요청_디자인시작일 = $13, 신청요청_디자인완료일 = $14,
        디자이너배정 = $15, 검수완료 = $16, 공수 = $17, updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *
    `;

    const params = [
      분사명, 회사, 요청일, 원료보정일, 담당MD, 요청자,
      업무명, 요청내용, 작업상황, 요청자URL, 메모, 진행상태,
      신청요청_디자인시작일, 신청요청_디자인완료일, 디자이너배정, 검수완료, 공수, parseInt(id)
    ];

    const result = await query(sql, params);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: '업무 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('업무 요청 수정 에러:', error);
    return NextResponse.json(
      { success: false, error: '업무 요청 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE - 업무 요청 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sql = 'DELETE FROM work_requests WHERE id = $1 RETURNING *';
    const result = await query(sql, [parseInt(id)]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: '업무 요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '업무 요청이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('업무 요청 삭제 에러:', error);
    return NextResponse.json(
      { success: false, error: '업무 요청 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
