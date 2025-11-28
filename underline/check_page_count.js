const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPageCountColumn() {
    try {
        // Check if page_count column exists by querying the table
        const { data, error } = await supabase
            .from('member_books')
            .select('id, book_title, page_count')
            .limit(5);

        if (error) {
            console.error('❌ Error querying member_books:', error.message);
            if (error.message.includes('page_count')) {
                console.log('\n⚠️  page_count column does not exist yet!');
                console.log('\n📋 Please run this SQL migration in Supabase SQL Editor:');
                console.log('\n' + '-'.repeat(60));
                console.log('alter table public.member_books');
                console.log('add column if not exists page_count integer default 0;');
                console.log('\ncomment on column public.member_books.page_count is');
                console.log("  'Number of pages in the book, from Aladin API';");
                console.log('-'.repeat(60) + '\n');
            }
            return;
        }

        console.log('✅ page_count column exists!');
        console.log('\n📚 Current books in database:');
        if (data && data.length > 0) {
            data.forEach(book => {
                console.log(`  - ${book.book_title}: ${book.page_count || 0} pages`);
            });
        } else {
            console.log('  (No books found)');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

checkPageCountColumn();
