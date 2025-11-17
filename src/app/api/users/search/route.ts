import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// 사용자 검색 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q');
    const part = searchParams.get('part'); // 특정 파트 필터링

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    let whereClause = 'WHERE (name ILIKE $1 OR email ILIKE $1)';
    let params = [`%${searchTerm}%`];
    let paramIndex = 2;

    // 파트 필터링 (선택사항)
    if (part) {
      whereClause += ` AND position = $${paramIndex}`;
      params.push(part);
      paramIndex++;
    }

    const result = await query(`
      SELECT 
        id, name, email, position
      FROM users 
      ${whereClause}
      ORDER BY name ASC
      LIMIT 10
    `, params);

    // 사용자 정보를 클라이언트에 맞게 변환
    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      part: user.position || '미지정',
      displayName: `${user.name} (${user.position || '미지정'})`
    }));

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('사용자 검색 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '사용자 검색에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
