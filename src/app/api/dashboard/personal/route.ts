import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/database';

// 개인 대시보드 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 현재 사용자 정보 조회
    const userResult = await query(
      'SELECT id, name, email, position FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    const userId = user.id;

    // 1. 오늘의 할일은 myTasks에서 필터링해서 처리

    // 2. 나의 모든 Task (모든 프로젝트의 Task)
    const myTasksResult = await query(`
      SELECT 
        t.id, t.title, t.status, t.start_date, t.end_date, t.priority,
        p.name as project_name, p.start_month, p.end_month,
        p.pm_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = $1
      ORDER BY t.start_date ASC
    `, [userId]);

    // 3. Task 상태별 통계 (모든 Task)
    const taskStatsResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks t
      WHERE t.assignee_id = $1
      GROUP BY status
    `, [userId]);


    // 통계 데이터 정리
    const taskStats = {
      대기: 0,
      진행중: 0,
      완료: 0,
      보류: 0
    };

    taskStatsResult.rows.forEach(row => {
      taskStats[row.status] = parseInt(row.count);
    });

    const totalTasks = Object.values(taskStats).reduce((sum, count) => sum + count, 0);
    const completionRate = totalTasks > 0 ? Math.round((taskStats.완료 / totalTasks) * 100) : 0;

    // 모든 날짜를 한국 시간으로 변환하는 함수
    // 모든 날짜를 한국 시간으로 변환하는 함수
    const convertToKST = (utcDate) => {
      if (!utcDate) return null;
      
      // UTC 날짜를 Date 객체로 변환
      const date = new Date(utcDate);
      
      // 한국 시간으로 변환 (+9시간)
      const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      
      // YYYY-MM-DD 형태로 반환
      return kstDate.toISOString().split('T')[0];
    };

    // 오늘의 할일 필터링 (한국 시간 기준)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('오늘 날짜:', todayStr);
    console.log('전체 task 개수:', myTasksResult.rows.length);
    
    // 모든 Task의 날짜를 한국 시간으로 변환
    const convertedMyTasks = myTasksResult.rows.map(task => {
      console.log('변환 전:', task.start_date, task.end_date);
      
      const converted = {
        ...task,
        start_date: convertToKST(task.start_date),
        end_date: convertToKST(task.end_date)
      };
      
      console.log('변환 후:', converted.start_date, converted.end_date);
      
      return converted;
    });

    // 오늘의 할일 필터링 (변환된 한국 시간 기준)
    const convertedTodayTasks = convertedMyTasks.filter(task => {
      const isToday = task.start_date <= todayStr && task.end_date >= todayStr && task.status !== '완료';
      console.log(`Task ${task.id}: ${task.start_date} <= ${todayStr} <= ${task.end_date} && ${task.status} !== '완료' = ${isToday}`);
      return isToday;
    });

    console.log('오늘의 할일 개수:', convertedTodayTasks.length);
    console.log('오늘의 할일 데이터:', convertedTodayTasks);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          position: user.position
        },
        todayTasks: convertedTodayTasks,
        myTasks: convertedMyTasks,
        taskStats,
        summary: {
          totalTasks,
          completionRate,
          todayTaskCount: convertedTodayTasks.length,
          inProgressCount: taskStats.진행중
        }
      }
    });
  } catch (error) {
    console.error('개인 대시보드 데이터 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '대시보드 데이터 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
