import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/database';

// 현재 로그인한 사용자 정보 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const result = await query(`
      SELECT id, name, email, position
      FROM users
      WHERE email = $1
    `, [session.user.email]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '사용자 정보 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
