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
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    console.log("Seeding data...");

    // 1. Insert Members (Let ID auto-increment)
    const members = [
        {
            nickname: "책읽는철수",
            gender: "male",
            age: 28,
            location: "서울 강남구",
            height: 175,
            religion: "none",
            smoking: "non-smoker",
            drinking: "social",
            bio: "철학 책을 좋아합니다.",
            photo_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            photos: ["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"],
            // auth_id: "..." // Can be null for test users or linked to real auth users if needed
        },
        {
            nickname: "문학소년",
            gender: "male",
            age: 30,
            location: "경기도 분당",
            height: 180,
            religion: "christianity",
            smoking: "non-smoker",
            drinking: "non-drinker",
            bio: "소설 쓰는 개발자입니다.",
            photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"]
        },
        {
            nickname: "독서왕영희",
            gender: "female",
            age: 27,
            location: "서울 마포구",
            height: 163,
            religion: "none",
            smoking: "non-smoker",
            drinking: "non-drinker",
            bio: "에세이를 좋아해요.",
            photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            photos: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"]
        },
        {
            nickname: "커피와책",
            gender: "female",
            age: 29,
            location: "서울 성동구",
            height: 168,
            religion: "catholicism",
            smoking: "non-smoker",
            drinking: "social",
            bio: "카페에서 책 읽는게 취미입니다.",
            photo_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            photos: ["https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"]
        }
    ];

    const insertedMembers = [];

    for (const member of members) {
        const { data, error } = await supabase
            .from('member')
            .insert(member)
            .select()
            .single();

        if (error) {
            console.error(`Error inserting member ${member.nickname}:`, error);
        } else {
            console.log(`Inserted member: ${member.nickname} (ID: ${data.id})`);
            insertedMembers.push(data);
        }
    }

    // 2. Insert Books
    const books = [
        {
            title: "사피엔스",
            author: "유발 하라리",
            cover: "https://image.aladin.co.kr/product/6853/49/cover200/8932917248_2.jpg",
            review: "인류의 역사를 통찰하는 명작. 정말 흥미롭게 읽었습니다."
        },
        {
            title: "데미안",
            author: "헤르만 헤세",
            cover: "https://image.aladin.co.kr/product/6853/49/cover200/8932917248_2.jpg", // Placeholder
            review: "내면의 성장을 다룬 고전. 읽을 때마다 새로운 느낌."
        },
        {
            title: "사랑의 기술",
            author: "에리히 프롬",
            cover: "https://image.aladin.co.kr/product/6853/49/cover200/8932917248_2.jpg", // Placeholder
            review: "사랑에 대한 깊이 있는 고찰. 관계에 대해 다시 생각하게 됨."
        },
        {
            title: "총 균 쇠",
            author: "재레드 다이아몬드",
            cover: "https://image.aladin.co.kr/product/6853/49/cover200/8932917248_2.jpg", // Placeholder
            review: "문명의 불평등 기원을 밝히는 책. 시야가 넓어지는 기분."
        }
    ];

    for (let i = 0; i < insertedMembers.length; i++) {
        const member = insertedMembers[i];
        const book = books[i % books.length]; // Cycle through books

        const { error } = await supabase
            .from('member_books')
            .insert({
                member_id: member.id, // Use the integer ID
                book_title: book.title,
                book_author: book.author,
                book_cover: book.cover,
                book_review: book.review
            });

        if (error) {
            console.error(`Error inserting book for ${member.nickname}:`, error);
        } else {
            console.log(`Inserted book for ${member.nickname}`);
        }
    }

    console.log("Seeding complete.");
}

seedData();
