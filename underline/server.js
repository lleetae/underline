const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// CORS 설정
app.use(cors());
app.use(express.json());

const ALADIN_API_KEY = 'ttbboookbla1908004';

// 책 검색 API
app.get('/api/books/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: '검색어를 입력해주세요' });
        }

        const aladinUrl = `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${ALADIN_API_KEY}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=10&start=1&SearchTarget=Book&output=js&Version=20131101&Cover=Big`;

        const response = await fetch(aladinUrl);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: '검색 중 오류가 발생했습니다' });
    }
});

// 책 상세 정보 API
app.get('/api/books/detail/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;

        if (!isbn) {
            return res.status(400).json({ error: 'ISBN을 입력해주세요' });
        }

        const aladinUrl = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${ALADIN_API_KEY}&itemIdType=ISBN13&ItemId=${isbn}&output=js&Version=20131101&OptResult=description&Cover=Big`;

        const response = await fetch(aladinUrl);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('Detail error:', error);
        res.status(500).json({ error: '상세 정보 조회 중 오류가 발생했습니다' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Aladin API 프록시 서버가 http://localhost:${PORT}에서 실행 중입니다`);
});
