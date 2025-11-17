import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, projectIds, currentUserId } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: '시작일과 종료일을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!projectIds || projectIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 하나의 프로젝트를 선택해주세요.' },
        { status: 400 }
      );
    }

    // 선택된 프로젝트들 정보 조회
    const projectIdsStr = projectIds.map((id: number) => `$${projectIds.indexOf(id) + 1}`).join(',');
    const projectsResult = await query(
      `SELECT id, name, description FROM projects WHERE id IN (${projectIdsStr})`,
      projectIds
    );

    if (projectsResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '선택된 프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const projects = projectsResult.rows;
    const allProjectIds = projects.map(p => p.id);

    // 모든 프로젝트의 완료된 작업들 조회 (본인 작업만)
    const completedTasksResult = await query(
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
        t.updated_at as "updatedAt",
        u.name as "assigneeName",
        u.position as "assigneePosition",
        p.name as "projectName",
        p.id as "projectId"
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.project_id = ANY($1)
        AND t.status = '완료'
        AND t.updated_at::date BETWEEN $2 AND $3
        ${currentUserId ? 'AND t.assignee_id = $4' : ''}
      ORDER BY p.name, t.updated_at DESC
      `,
      currentUserId ? [allProjectIds, startDate, endDate, currentUserId] : [allProjectIds, startDate, endDate]
    );

    // 모든 프로젝트의 진행중인 작업들 조회 (본인 작업만)
    const inProgressTasksResult = await query(
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
        t.updated_at as "updatedAt",
        u.name as "assigneeName",
        u.position as "assigneePosition",
        p.name as "projectName",
        p.id as "projectId"
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.project_id = ANY($1)
        AND t.status = '진행중'
        ${currentUserId ? 'AND t.assignee_id = $2' : ''}
      ORDER BY p.name, t.priority DESC, t.end_date ASC
      `,
      currentUserId ? [allProjectIds, currentUserId] : [allProjectIds]
    );

    // 향후 7일간 예정된 작업들 조회 (본인 작업만)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const upcomingTasksResult = await query(
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
        u.name as "assigneeName",
        u.position as "assigneePosition",
        p.name as "projectName",
        p.id as "projectId"
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.project_id = ANY($1)
        AND t.status IN ('대기', '진행중')
        AND t.start_date <= $2
        ${currentUserId ? 'AND t.assignee_id = $3' : ''}
      ORDER BY p.name, t.start_date ASC, t.priority DESC
      `,
      currentUserId ? [allProjectIds, futureDateStr, currentUserId] : [allProjectIds, futureDateStr]
    );

    const completedTasks = completedTasksResult.rows;
    const inProgressTasks = inProgressTasksResult.rows;
    const upcomingTasks = upcomingTasksResult.rows;

    // 프로젝트별로 데이터 그룹화
    const projectData = projects.map(project => {
      const projectCompletedTasks = completedTasks.filter(task => task.projectId === project.id);
      const projectInProgressTasks = inProgressTasks.filter(task => task.projectId === project.id);
      const projectUpcomingTasks = upcomingTasks.filter(task => task.projectId === project.id);

      return {
        project,
        completedTasks: projectCompletedTasks,
        inProgressTasks: projectInProgressTasks,
        upcomingTasks: projectUpcomingTasks
      };
    });

    // Gemini API로 통합 주간회의록 생성 (보고서 형식만)
    const geminiPrompt = `
프로젝트 목록: ${projects.map(p => p.name).join(', ')}
기간: ${startDate} ~ ${endDate}

=== 완료된 작업 ===
${completedTasks.map(task => 
  `- ${task.title} (${task.projectName})`
).join('\n')}

=== 진행중인 작업 ===
${inProgressTasks.map(task => 
  `- ${task.title} (${task.projectName})`
).join('\n')}

=== 향후 7일간 예정된 작업 ===
${upcomingTasks.map(task => 
  `- ${task.title} (${task.projectName})`
).join('\n')}

위 정보를 바탕으로 딱 다음 형식으로만 주간회의록을 작성해주세요. 추가 설명이나 해석은 절대 하지 마세요:

# 주간회의록
**기간**: ${startDate} ~ ${endDate}

## 1. **주요 업무 진행 상황**

- **진행 중인 업무/프로젝트**:
${projects.map(project => `    - ${project.name}`).join('\n')}

## 2. **성과 및 이슈**

- 성과:
${projectData.map(data => 
  data.completedTasks.length > 0 ? 
  `    - **${data.project.name}**
        ${data.completedTasks.map(task => `        - ${task.title}`).join('\n')}` : 
  ''
).filter(Boolean).join('\n')}

---

## 3. 이번 **주 계획**

- **목표**:
${projectData.map(data => 
  data.upcomingTasks.length > 0 ? 
  `    - **${data.project.name}**
        ${data.upcomingTasks.map(task => `        - ${task.title}`).join('\n')}` : 
  ''
).filter(Boolean).join('\n')}
`;

    // Gemini API 호출
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: geminiPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error('Gemini API 호출 실패');
    }

    const geminiData = await geminiResponse.json();
    const weeklyReport = geminiData.candidates[0].content.parts[0].text;

    return NextResponse.json({
      success: true,
      data: {
        period: `${startDate} ~ ${endDate}`,
        projects: projects,
        completedTasks,
        inProgressTasks,
        upcomingTasks,
        weeklyReport,
        summary: {
          totalCompleted: completedTasks.length,
          totalInProgress: inProgressTasks.length,
          totalUpcoming: upcomingTasks.length,
          totalProjects: projects.length
        }
      }
    });

  } catch (error) {
    console.error('통합 주간회의록 생성 에러:', error);
    return NextResponse.json(
      { success: false, error: '통합 주간회의록 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
