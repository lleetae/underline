import { NextRequest, NextResponse } from 'next/server';

const ALADIN_API_KEY = process.env.ALADIN_API_KEY;

export async function GET(request: NextRequest) {
    try {
        // Validate API key
        if (!ALADIN_API_KEY) {
            console.error('ALADIN_API_KEY is not configured');
            return NextResponse.json(
                { error: '서버 설정 오류가 발생했습니다' },
                { status: 500 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json(
                { error: '검색어를 입력해주세요' },
                { status: 400 }
            );
        }

        const aladinUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${ALADIN_API_KEY}&Query=${encodeURIComponent(
            query
        )}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101&Cover=Big`;

        console.log('Search Query:', query);
        console.log('API Key configured:', !!ALADIN_API_KEY);
        console.log('Request URL:', aladinUrl);

        const response = await fetch(aladinUrl);
        const text = await response.text();
        console.log('Aladin Raw Response:', text.substring(0, 200)); // Log first 200 chars

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            throw new Error('Invalid JSON response from Aladin');
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: '검색 중 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}
