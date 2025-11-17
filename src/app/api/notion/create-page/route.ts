import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, title, databaseId } = await request.json();

    if (!content || !title) {
      return NextResponse.json(
        { success: false, error: '내용과 제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 노션 API로 페이지 생성
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId || process.env.NOTION_DATABASE_ID
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: title
                }
              }
            ]
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content
                  }
                }
              ]
            }
          }
        ]
      })
    });

    if (!notionResponse.ok) {
      const errorData = await notionResponse.json();
      console.error('노션 API 에러:', errorData);
      return NextResponse.json(
        { success: false, error: '노션 페이지 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const notionData = await notionResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        pageId: notionData.id,
        url: notionData.url,
        title: title
      }
    });

  } catch (error) {
    console.error('노션 페이지 생성 에러:', error);
    return NextResponse.json(
      { success: false, error: '노션 페이지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
