import { NextRequest, NextResponse } from 'next/server';

const ALADIN_API_KEY = 'ttbboookbla1908004';

export async function GET(
    _request: NextRequest,
    { params }: { params: { isbn: string } }
) {
    try {
        const { isbn } = params;

        if (!isbn) {
            return NextResponse.json(
                { error: 'ISBN을 입력해주세요' },
                { status: 400 }
            );
        }

        const aladinUrl = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${ALADIN_API_KEY}&itemIdType=ISBN13&ItemId=${isbn}&output=js&Version=20131101&OptResult=description&Cover=Big`;

        const response = await fetch(aladinUrl);
        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Detail error:', error);
        return NextResponse.json(
            { error: '상세 정보 조회 중 오류가 발생했습니다' },
            { status: 500 }
        );
    }
}
