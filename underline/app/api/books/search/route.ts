import { NextRequest, NextResponse } from 'next/server';

const ALADIN_API_KEY = 'ttbboookbla1908004';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json(
                { error: '검색어를 입력해주세요' },
                { status: 400 }
            );
        }

        const aladinUrl = `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${ALADIN_API_KEY}&Query=${encodeURIComponent(
            query
        )}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101&Cover=Big`;

        const response = await fetch(aladinUrl);
        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: '검색 중 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}
