import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// Task 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const part = searchParams.get('part');
    const month = searchParams.get('month');

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (projectId) {
      whereConditions.push(`project_id = $${paramIndex}`);
      params.push(parseInt(projectId));
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (part) {
      whereConditions.push(`part = $${paramIndex}`);
      params.push(part);
      paramIndex++;
    }

    if (month) {
      whereConditions.push(`month = $${paramIndex}`);
      params.push(month);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const result = await query(`
      SELECT 
        t.id, t.project_id, t.title, t.description, t.month, 
        t.category, t.part, t.assignee_id, t.assignee_name, 
        t.status, t.start_date, t.end_date, t.pm_confirmed, 
        t.pm_confirmed_date, t.created_at, t.updated_at,
        p.name as project_name, p.pm_name, p.start_month, p.end_month
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `, params);

    // 데이터베이스 필드명을 camelCase로 변환
    const transformedData = result.rows.map(row => ({
      ...row,
      assigneeId: row.assignee_id,
      assigneeName: row.assignee_name,
      projectId: row.project_id,
      startDate: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : null,
      endDate: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : null,
      pmConfirmed: row.pm_confirmed,
      pmConfirmedDate: row.pm_confirmed_date ? new Date(row.pm_confirmed_date).toISOString().split('T')[0] : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      projectName: row.project_name,
      pmName: row.pm_name,
      startMonth: row.start_month,
      endMonth: row.end_month
    }));

    return NextResponse.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Task 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Task 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 새 Task 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      title,
      description,
      month,
      category,
      part,
      assigneeId,
      assigneeName,
      status = '대기',
      startDate,
      endDate
    } = body;

    const result = await query(`
      INSERT INTO tasks (
        project_id, title, description, month, category, part,
        assignee_id, assignee_name, status, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      projectId, title, description, month, category, part,
      assigneeId, assigneeName, status, startDate, endDate
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Task 생성 에러:', error);
    return NextResponse.json(
      { success: false, error: 'Task 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
