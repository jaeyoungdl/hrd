import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      month,
      category,
      part,
      assigneeName,
      status,
      startDate,
      endDate,
      projectId
    } = body;

    // 필수 필드 검증
    if (!title || !projectId || !month) {
      return NextResponse.json(
        { success: false, error: '제목, 프로젝트 ID, 월은 필수입니다.' },
        { status: 400 }
      );
    }

    // 담당자 ID 찾기 (이름으로)
    let assigneeId = null;
    if (assigneeName) {
      const userResult = await query(
        'SELECT id FROM users WHERE name = $1',
        [assigneeName]
      );
      if (userResult.rowCount > 0) {
        assigneeId = userResult.rows[0].id;
      }
    }

    // Task 생성
    const result = await query(
      `INSERT INTO tasks (
        title, 
        month, 
        category, 
        part, 
        assignee_id, 
        assignee_name, 
        status, 
        start_date, 
        end_date, 
        project_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
      RETURNING *`,
      [
        title,
        month,
        category || '개발',
        part || 'frontend',
        assigneeId,
        assigneeName || null,
        status || '대기',
        startDate || null,
        endDate || null,
        projectId
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Task 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Task가 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('Task 생성 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Task 생성에 실패했습니다.', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
