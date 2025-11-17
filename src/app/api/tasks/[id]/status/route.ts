import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// Task 상태 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    const { status } = await request.json();

    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 Task ID입니다.' },
        { status: 400 }
      );
    }

    if (!status || !['대기', '진행중', '완료', '보류'].includes(status)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    // Task 상태 업데이트 (완료 시 completed_at도 설정)
    const result = await query(
      `UPDATE tasks 
       SET status = $1, 
           updated_at = NOW(),
           completed_at = CASE WHEN $1 = '완료' AND completed_at IS NULL THEN NOW() ELSE completed_at END
       WHERE id = $2 
       RETURNING *`,
      [status, taskId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Task를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Task 상태 업데이트 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Task 상태 업데이트에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
