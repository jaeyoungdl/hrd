import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    const { startDate, endDate } = await request.json();

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 프로젝트 ID입니다.' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: '시작일과 종료일을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 프로젝트 정보 조회
    const projectResult = await query(
      'SELECT name, description FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const project = projectResult.rows[0];

    // 해당 기간의 완료된 작업들 조회
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
        u.position as "assigneePosition"
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = $1 
        AND t.status = '완료'
        AND t.updated_at::date BETWEEN $2 AND $3
      ORDER BY t.updated_at DESC
      `,
      [projectId, startDate, endDate]
    );

    // 진행중인 작업들 조회
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
        u.position as "assigneePosition"
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = $1 
        AND t.status = '진행중'
      ORDER BY t.priority DESC, t.end_date ASC
      `,
      [projectId]
    );

    // 향후 7일간 예정된 작업들 조회
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
        u.position as "assigneePosition"
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = $1 
        AND t.status IN ('대기', '진행중')
        AND t.start_date <= $2
      ORDER BY t.start_date ASC, t.priority DESC
      `,
      [projectId, futureDateStr]
    );

    const completedTasks = completedTasksResult.rows;
    const inProgressTasks = inProgressTasksResult.rows;
    const upcomingTasks = upcomingTasksResult.rows;

    // Gemini API로 주간회의록 생성 (노션 형식)
    const geminiPrompt = `
프로젝트명: ${project.name}
프로젝트 설명: ${project.description || '설명 없음'}

=== 이번 주 완료된 작업 (${startDate} ~ ${endDate}) ===
${completedTasks.map(task => 
  `- ${task.title} (${task.part}) - ${task.assigneeName} (${task.assigneePosition})`
).join('\n')}

=== 현재 진행중인 작업 ===
${inProgressTasks.map(task => 
  `- ${task.title} (${task.part}) - ${task.assigneeName} (${task.assigneePosition}) - 우선순위: ${task.priority}`
).join('\n')}

=== 향후 7일간 예정된 작업 ===
${upcomingTasks.map(task => 
  `- ${task.title} (${task.part}) - ${task.assigneeName} (${task.assigneePosition}) - 예정일: ${task.startDate}`
).join('\n')}

위 정보를 바탕으로 노션 형식의 주간회의록을 작성해주세요. 다음 형식으로 작성해주세요:

# ${project.name} 주간회의록
**기간**: ${startDate} ~ ${endDate}

## 1. **주요 업무 진행 상황**

- **진행 중인 업무/프로젝트**:
    - ${project.name}

## 2. **성과 및 이슈**

- 성과:
    - **${project.name}**
        ${completedTasks.map(task => `        - ${task.title} (${task.part})`).join('\n')}
        
- 이슈:
    ${inProgressTasks.length > 0 ? `    - **진행중인 작업들**\n        ${inProgressTasks.map(task => `        - ${task.title} (${task.part}) - ${task.assigneeName}`).join('\n')}` : '    - 이번 주 특별한 이슈 없음'}

---

## 3. 이번 **주 계획**

- **목표**:
    - **${project.name}**
        ${upcomingTasks.map(task => `        - ${task.title} (${task.part}) - ${task.assigneeName}`).join('\n')}

- **우선순위**:
    - 높음: ${upcomingTasks.filter(task => task.priority === '높음').map(task => task.title).join(', ') || '없음'}
    - 보통: ${upcomingTasks.filter(task => task.priority === '보통').map(task => task.title).join(', ') || '없음'}
    - 낮음: ${upcomingTasks.filter(task => task.priority === '낮음').map(task => task.title).join(', ') || '없음'}

---

## 4. **팀원별 기여도**

${[...new Set([...completedTasks, ...inProgressTasks].map(task => task.assigneeName))].map(member => {
  const memberTasks = [...completedTasks, ...inProgressTasks].filter(task => task.assigneeName === member);
  return `- **${member}**: ${memberTasks.length}개 작업 (완료: ${memberTasks.filter(t => t.status === '완료').length}개, 진행중: ${memberTasks.filter(t => t.status === '진행중').length}개)`;
}).join('\n')}

---

## 5. **다음 주 주요 포인트**

- ${upcomingTasks.length > 0 ? upcomingTasks.slice(0, 3).map(task => `- ${task.title} (${task.startDate})`).join('\n') : '- 다음 주 예정된 작업 없음'}
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
          maxOutputTokens: 2048,
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
        projectName: project.name,
        period: `${startDate} ~ ${endDate}`,
        completedTasks,
        inProgressTasks,
        upcomingTasks,
        weeklyReport
      }
    });

  } catch (error) {
    console.error('주간회의록 생성 에러:', error);
    return NextResponse.json(
      { success: false, error: '주간회의록 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
