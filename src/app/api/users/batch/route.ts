import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// 여러 사용자 ID로 사용자 정보 조회
export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const result = await query(`
      SELECT id, name, position
      FROM users
      WHERE id = ANY($1)
    `, [userIds]);

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('사용자 일괄 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '사용자 정보 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
