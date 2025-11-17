import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, position } = await request.json();

    // 입력 검증
    if (!email || !password || !name || !position) {
      return NextResponse.json(
        { success: false, error: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    const result = await query(
      'INSERT INTO users (email, password, name, position) VALUES ($1, $2, $3, $4) RETURNING id, email, name, position',
      [email, hashedPassword, name, position]
    );

    const newUser = result.rows[0];

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        position: newUser.position
      }
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    return NextResponse.json(
      { success: false, error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
