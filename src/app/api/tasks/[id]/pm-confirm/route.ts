import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    
    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 Task ID입니다.' },
        { status: 400 }
      );
    }

    // Task의 PM 확인 상태 업데이트
    const result = await query(
      `UPDATE tasks 
       SET pm_confirmed = true, 
           pm_confirmed_date = CURRENT_DATE,
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [taskId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Task를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'PM 확인이 완료되었습니다.'
    });

  } catch (error) {
    console.error('PM 확인 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'PM 확인에 실패했습니다.', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
