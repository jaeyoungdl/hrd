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

    // 프로젝트 정보 가져오기
    const projectResult = await query(
      `SELECT frontend, backend, designer, ux, app, ai FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const project = projectResult.rows[0];
    
    // 모든 멤버 ID 수집
    const allMemberIds = [
      ...(project.frontend || []),
      ...(project.backend || []),
      ...(project.designer || []),
      ...(project.ux || []),
      ...(project.app || []),
      ...(project.ai || [])
    ];

    if (allMemberIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // 멤버 정보 가져오기
    const placeholders = allMemberIds.map((_, index) => `$${index + 1}`).join(', ');
    const membersResult = await query(
      `SELECT id, name, position FROM users WHERE id IN (${placeholders})`,
      allMemberIds
    );

    return NextResponse.json({
      success: true,
      data: membersResult.rows
    });
  } catch (error) {
    console.error('프로젝트 멤버 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '프로젝트 멤버 조회에 실패했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
