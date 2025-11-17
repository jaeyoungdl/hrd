import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// 통계 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let whereClause = '';
    let params = [];
    
    if (projectId) {
      whereClause = 'WHERE project_id = $1';
      params = [parseInt(projectId)];
    }

    // Task 상태별 통계
    const statusStats = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks 
      ${whereClause}
      GROUP BY status
    `, params);

    // 파트별 통계
    const partStats = await query(`
      SELECT 
        part,
        COUNT(*) as count
      FROM tasks 
      ${whereClause}
      GROUP BY part
    `, params);

    // 월별 통계
    const monthStats = await query(`
      SELECT 
        month,
        COUNT(*) as count
      FROM tasks 
      ${whereClause}
      GROUP BY month
      ORDER BY month DESC
    `, params);

    // 상태별 통계를 객체로 변환
    const statusCounts = {
      대기: 0,
      진행중: 0,
      완료: 0,
      보류: 0
    };

    statusStats.rows.forEach(row => {
      statusCounts[row.status as keyof typeof statusCounts] = parseInt(row.count);
    });

    // 파트별 통계를 객체로 변환
    const partCounts: Record<string, number> = {};
    partStats.rows.forEach(row => {
      partCounts[row.part] = parseInt(row.count);
    });

    // 월별 통계를 배열로 변환
    const monthCounts = monthStats.rows.map(row => ({
      month: row.month,
      count: parseInt(row.count)
    }));

    return NextResponse.json({
      success: true,
      data: {
        status: statusCounts,
        parts: partCounts,
        months: monthCounts,
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
      }
    });
  } catch (error) {
    console.error('통계 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '통계 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}