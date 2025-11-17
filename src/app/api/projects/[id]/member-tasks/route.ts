import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    
    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 프로젝트 ID입니다.' },
        { status: 400 }
      );
    }

    // 프로젝트의 멤버별 작업 목록 가져오기
    const result = await query(
      `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.part,
        t.priority,
        t.start_date as "startDate",
        t.end_date as "endDate",
        t.created_at as "createdAt",
        t.updated_at as "updatedAt",
        u.id as "assignedUserId",
        u.name as "assignedUserName",
        u.position as "assignedUserPosition"
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
      `,
      [projectId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('멤버 작업 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '멤버 작업 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
