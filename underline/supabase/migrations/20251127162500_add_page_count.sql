-- Add page_count column to member_books table
alter table public.member_books 
add column if not exists page_count integer default 0;

-- Add comment to explain the column
comment on column public.member_books.page_count is 'Number of pages in the book, from Aladin API';
