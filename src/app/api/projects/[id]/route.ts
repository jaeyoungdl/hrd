import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 프로젝트 ID입니다.',
      });
    }

    // 프로젝트 정보 가져오기
    const result = await query(
      `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.start_month as "startMonth",
        p.end_month as "endMonth",
        p.pm_id as "pmId",
        u.name as "pmName",
        COALESCE(p.frontend, '{}') as "frontendMembers",
        COALESCE(p.backend, '{}') as "backendMembers",
        COALESCE(p.designer, '{}') as "designerMembers",
        COALESCE(p.ux, '{}') as "uxMembers",
        COALESCE(p.app, '{}') as "appMembers",
        COALESCE(p.ai, '{}') as "aiMembers",
        COUNT(t.id) as "taskCount",
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as "completedTasks",
        COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END) as "waitingTasks",
        COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) as "inProgressTasks"
      FROM projects p
      LEFT JOIN users u ON p.pm_id = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.description, p.start_month, p.end_month, p.pm_id, u.name,
               p.frontend_members, p.backend_members, p.designer_members, p.ux_members,
               p.app_members, p.ai_members
      `,
      [projectId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다.',
      });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('프로젝트 조회 에러:', error);
    return NextResponse.json({
      success: false,
      error: '프로젝트 조회 중 오류가 발생했습니다.',
    });
  }
}