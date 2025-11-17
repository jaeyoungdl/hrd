import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// 프로젝트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active' | 'completed' | 'all'

    let whereClause = '';
    if (status === 'active') {
      whereClause = "WHERE end_month >= TO_CHAR(CURRENT_DATE, 'YYYY-MM')";
    } else if (status === 'completed') {
      whereClause = "WHERE end_month < TO_CHAR(CURRENT_DATE, 'YYYY-MM')";
    }

    const result = await query(`
      SELECT 
        p.id, p.name, p.description, 
        p.start_month as "startMonth", p.end_month as "endMonth", 
        p.pm_id as "pmId", p.pm_name as "pmName", 
        p.frontend as "frontendMembers", p.backend as "backendMembers", 
        p.designer as "designerMembers", p.ux as "uxMembers", 
        p.app as "appMembers", p.ai as "aiMembers",
        p.created_at as "createdAt", p.updated_at as "updatedAt",
        COALESCE(task_stats.total_tasks, 0) as "taskCount",
        COALESCE(task_stats.waiting_tasks, 0) as "waitingTasks",
        COALESCE(task_stats.in_progress_tasks, 0) as "inProgressTasks",
        COALESCE(task_stats.completed_tasks, 0) as "completedTasks",
        COALESCE(task_stats.pending_tasks, 0) as "pendingTasks"
      FROM projects p
      LEFT JOIN (
        SELECT 
          project_id,
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = '대기' THEN 1 END) as waiting_tasks,
          COUNT(CASE WHEN status = '진행중' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = '완료' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = '보류' THEN 1 END) as pending_tasks
        FROM tasks
        GROUP BY project_id
      ) task_stats ON p.id = task_stats.project_id
      ${whereClause}
      ORDER BY p.created_at DESC
    `);

    console.log('📊 프로젝트 조회 결과:', result.rows.length, '개');

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('프로젝트 조회 에러:', error);
    
    // 에러 상세 정보 로깅
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('에러 스택:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: '프로젝트 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 새 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      startMonth,
      endMonth,
      pmId,
      pmName,
      frontendMembers = [],
      backendMembers = [],
      designerMembers = [],
      uxMembers = [],
      appMembers = [],
      aiMembers = []
    } = body;

    const result = await query(`
      INSERT INTO projects (
        name, description, start_month, end_month, pm_id, pm_name,
        frontend, backend, designer, 
        ux, app, ai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      name, description, startMonth, endMonth, pmId, pmName,
      frontendMembers, backendMembers, designerMembers,
      uxMembers, appMembers, aiMembers
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('프로젝트 생성 에러:', error);
    return NextResponse.json(
      { success: false, error: '프로젝트 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
