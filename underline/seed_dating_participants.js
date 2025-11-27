const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// 남성 더미 데이터
const maleParticipants = [
    {
        nickname: "책과커피",
        gender: "male",
        age: 28,
        location: "서울 강남구",
        height: 178,
        religion: "none",
        smoking: "non-smoker",
        drinking: "social",
        bio: "주말엔 카페에서 책 읽는 걸 좋아합니다. 철학과 심리학에 관심이 많아요.",
        photo_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60"]
    },
    {
        nickname: "문학소년",
        gender: "male",
        age: 30,
        location: "서울 서초구",
        height: 182,
        religion: "christianity",
        smoking: "non-smoker",
        drinking: "less-than-4",
        bio: "소설 쓰는 개발자입니다. 무라카미 하루키를 좋아합니다.",
        photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60"]
    },
    {
        nickname: "독서마니아",
        gender: "male",
        age: 27,
        location: "경기 성남시",
        height: 175,
        religion: "none",
        smoking: "non-smoker",
        drinking: "social",
        bio: "한 달에 5권 이상 읽습니다. 북토크 좋아하는 사람 찾아요!",
        photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60"]
    },
    {
        nickname: "역사덕후",
        gender: "male",
        age: 32,
        location: "서울 송파구",
        height: 180,
        religion: "none",
        smoking: "non-smoker",
        drinking: "non-drinker",
        bio: "역사책과 인문학을 좋아합니다. 함께 문화생활 즐기실 분.",
        photo_url: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=500&auto=format&fit=crop&q=60"]
    },
    {
        nickname: "시를읽는남자",
        gender: "male",
        age: 29,
        location: "서울 마포구",
        height: 176,
        religion: "catholicism",
        smoking: "non-smoker",
        drinking: "social",
        bio: "시집을 자주 읽습니다. 감성적인 대화를 나눌 수 있는 분을 만나고 싶어요.",
        photo_url: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=500&auto=format&fit=crop&q=60"]
    }
];

// 여성 더미 데이터
const femaleParticipants = [
    {
        nickname: "에세이러버",
        gender: "female",
        age: 27,
        location: "서울 용산구",
        height: 165,
        religion: "none",
        smoking: "non-smoker",
        drinking: "social",
        bio: "에세이를 좋아하고 글쓰기가 취미입니다. 책 이야기 나눌 사람 구해요.",
        photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60"]
    },
    {
        nickname: "북카페지기",
        gender: "female",
        age: 29,
        location: "서울 성동구",
        height: 168,
        religion: "christianity",
        smoking: "non-smoker",
        drinking: "less-than-4",
        bio: "카페에서 책 읽는 게 가장 행복합니다. 로맨스 소설 추천 환영!",
        photo_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60"]
    },
    {
        nickname: "심리학도",
        gender: "female",
        age: 28,
        location: "서울 강북구",
        height: 162,
        religion: "none",
        smoking: "non-smoker",
        drinking: "social",
        bio: "심리학 책을 즐겨 읽습니다. 사람의 마음에 관심이 많아요.",
        photo_url: "https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=500&auto=format&fit=crop&q=60"]
    },
    {
        nickname: "소설가지망생",
        gender: "female",
        age: 26,
        location: "경기 수원시",
        height: 160,
        religion: "none",
        smoking: "non-smoker",
        drinking: "non-drinker",
        bio: "한국 근현대 문학을 좋아합니다. 북클럽 활동도 하고 있어요.",
        photo_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60"]
    },
    {
        nickname: "철학하는여자",
        gender: "female",
        age: 30,
        location: "서울 종로구",
        height: 167,
        religion: "buddhism",
        smoking: "non-smoker",
        drinking: "social",
        bio: "철학과 종교 관련 책을 읽으며 삶의 의미를 찾아가고 있습니다.",
        photo_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=60"]
    },
    {
        nickname: "문학소녀",
        gender: "female",
        age: 25,
        location: "서울 광진구",
        height: 163,
        religion: "none",
        smoking: "non-smoker",
        drinking: "less-than-4",
        bio: "클래식 문학을 사랑합니다. 책방 투어가 취미예요.",
        photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60",
        photos: ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60"]
    }
];

// 책 더미 데이터
const books = [
    {
        title: "사피엔스",
        author: "유발 하라리",
        cover: "https://image.aladin.co.kr/product/6853/49/cover500/8934972464_2.jpg",
        reviews: [
            "인류의 역사를 통찰하는 명작. 정말 흥미롭게 읽었습니다. 읽고 나서 세상을 보는 시각이 완전히 달라졌어요.",
            "역사에 대한 새로운 시각을 제시하는 책. 인간이란 무엇인가에 대해 깊이 생각하게 되었습니다."
        ]
    },
    {
        title: "데미안",
        author: "헤르만 헤세",
        cover: "https://image.aladin.co.kr/product/108/66/cover500/8937462486_2.jpg",
        reviews: [
            "내면의 성장을 다룬 고전. 읽을 때마다 새로운 느낌을 줍니다. 청춘의 방황과 성장이 잘 담겨있어요.",
            "자아 찾기의 여정이 감동적입니다. 나를 돌아보게 만드는 책이에요."
        ]
    },
    {
        title: "사랑의 기술",
        author: "에리히 프롬",
        cover: "https://image.aladin.co.kr/product/296/96/cover500/8932917086_2.jpg",
        reviews: [
            "사랑에 대한 깊이 있는 고찰. 관계에 대해 다시 생각하게 됩니다. 진정한 사랑이 무엇인지 배웠어요.",
            "사랑은 기술이라는 관점이 신선합니다. 연애뿐 아니라 인간관계 전반에 도움이 되는 책."
        ]
    },
    {
        title: "1984",
        author: "조지 오웰",
        cover: "https://image.aladin.co.kr/product/3049/45/cover500/8932917183_2.jpg",
        reviews: [
            "디スト피아 소설의 걸작. 현대 사회에도 시사하는 바가 크네요. 정말 소름끼치는 예언서 같아요.",
            "자유와 감시에 대한 경고. 읽으면서 계속 생각하게 되는 책입니다."
        ]
    },
    {
        title: "82년생 김지영",
        author: "조남주",
        cover: "https://image.aladin.co.kr/product/10422/81/cover500/8936434594_2.jpg",
        reviews: [
            "현대 여성의 삶을 리얼하게 그려낸 소설. 공감되는 부분이 많았습니다.",
            "우리 사회의 문제를 잘 짚어낸 책. 남녀 모두 읽어야 할 필독서에요."
        ]
    },
    {
        title: "미움받을 용기",
        author: "기시미 이치로",
        cover: "https://image.aladin.co.kr/product/5686/56/cover500/8996991341_2.jpg",
        reviews: [
            "아들러 심리학을 쉽게 풀어낸 책. 자존감을 높이는 데 큰 도움이 되었습니다.",
            "타인의 시선에서 자유로워지는 법을 배웠어요. 삶의 태도가 바뀐 책."
        ]
    },
    {
        title: "코스모스",
        author: "칼 세이건",
        cover: "https://image.aladin.co.kr/product/1145/39/cover500/8983711892_2.jpg",
        reviews: [
            "우주에 대한 경이로움을 느끼게 하는 책. 과학의 아름다움을 알려줍니다.",
            "과학책인데 시처럼 읽혀요. 우리의 존재에 대해 겸손해지게 만드는 책."
        ]
    },
    {
        title: "연금술사",
        author: "파울로 코엘료",
        cover: "https://image.aladin.co.kr/product/196/27/cover500/8982814426_1.jpg",
        reviews: [
            "꿈을 찾아가는 여정이 감동적입니다. 인생의 진정한 보물은 무엇인지 생각하게 해요.",
            "우화 같은 이야기지만 깊은 교훈을 담고 있어요. 힘들 때마다 다시 읽게 되는 책."
        ]
    },
    {
        title: "노르웨이의 숲",
        author: "무라카미 하루키",
        cover: "https://image.aladin.co.kr/product/23/80/cover500/8932917248_2.jpg",
        reviews: [
            "청춘의 아픔과 상실이 잘 담겨있는 소설. 하루키 특유의 감성이 좋아요.",
            "삶과 죽음, 사랑에 대한 깊은 성찰. 여운이 오래 남는 작품입니다."
        ]
    },
    {
        title: "총 균 쇠",
        author: "재레드 다이아몬드",
        cover: "https://image.aladin.co.kr/product/1/17/cover500/8932913757_2.jpg",
        reviews: [
            "문명의 불평등 기원을 밝히는 책. 시야가 넓어지는 기분입니다.",
            "역사와 과학이 만나는 지점. 인류 문명에 대한 통찰력 있는 분석."
        ]
    }
];

async function seedDatingParticipants() {
    console.log("🎯 소개팅 참가자 더미 데이터 생성 시작...\n");

    const allParticipants = [...maleParticipants, ...femaleParticipants];
    const insertedMembers = [];

    // 1. 멤버 삽입 및 소개팅 신청
    console.log("📝 멤버 데이터 삽입 및 소개팅 신청 중...");
    for (const participant of allParticipants) {
        const { data, error } = await supabase
            .from('member')
            .insert(participant)
            .select()
            .single();

        if (error) {
            console.error(`❌ Error inserting ${participant.nickname}:`, error.message);
        } else {
            console.log(`✅ ${participant.nickname} (ID: ${data.id}) 추가됨`);
            insertedMembers.push(data);

            // 소개팅 신청 데이터 추가
            const { error: appError } = await supabase
                .from('dating_applications')
                .upsert({ member_id: data.id }, { onConflict: 'member_id' });

            if (appError) {
                console.error(`   ❌ Error inserting application for ${participant.nickname}:`, appError.message);
            } else {
                console.log(`   ✅ 소개팅 신청 완료`);
            }
        }
    }

    console.log(`\n📚 총 ${insertedMembers.length}명의 멤버 추가 완료\n`);

    // 2. 각 멤버에게 2-3권의 책 추가
    console.log("📖 책 데이터 삽입 중...");
    for (const member of insertedMembers) {
        const numBooks = Math.floor(Math.random() * 2) + 2; // 2개 또는 3개
        const memberBooks = [];

        // 랜덤하게 책 선택
        const shuffledBooks = [...books].sort(() => 0.5 - Math.random());

        for (let i = 0; i < numBooks; i++) {
            const book = shuffledBooks[i];
            const randomReview = book.reviews[Math.floor(Math.random() * book.reviews.length)];

            const { error } = await supabase
                .from('member_books')
                .insert({
                    member_id: member.id,
                    book_title: book.title,
                    book_author: book.author,
                    book_cover: book.cover,
                    book_review: randomReview
                });

            if (error) {
                console.error(`❌ Error inserting book for ${member.nickname}:`, error.message);
            } else {
                memberBooks.push(book.title);
            }
        }

        console.log(`  ✅ ${member.nickname}: ${memberBooks.join(', ')}`);
    }

    console.log("\n🎉 소개팅 참가자 데이터 생성 완료!");
    console.log(`\n📊 요약:`);
    console.log(`   - 남성: ${maleParticipants.length}명`);
    console.log(`   - 여성: ${femaleParticipants.length}명`);
    console.log(`   - 총: ${insertedMembers.length}명`);
}

seedDatingParticipants()
    .then(() => {
        console.log("\n✨ 완료!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Error:", error);
        process.exit(1);
    });
