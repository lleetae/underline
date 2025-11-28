import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkProfanity } from '../../lib/profanity';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get('nickname');

    if (!nickname) {
        return NextResponse.json(
            { available: false, message: '닉네임을 입력해주세요.' },
            { status: 400 }
        );
    }

    if (checkProfanity(nickname)) {
        return NextResponse.json(
            { available: false, message: '닉네임에 비속어는 사용할 수 없어요.' },
            { status: 200 }
        );
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
        const { data, error } = await supabase
            .from('member')
            .select('nickname')
            .eq('nickname', nickname)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
            console.error('Error checking nickname:', error);
            return NextResponse.json(
                { available: false, message: '서버 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        if (data) {
            return NextResponse.json(
                { available: false, message: '이미 사용 중인 닉네임입니다.' },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { available: true, message: '사용 가능한 닉네임입니다.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { available: false, message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
