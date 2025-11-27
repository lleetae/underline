create table if not exists public.member_books (
  id uuid not null default gen_random_uuid(),
  member_id uuid not null references public.member(id) on delete cascade,
  book_title text not null,
  book_author text,
  book_cover text,
  book_genre text,
  book_isbn13 text,
  book_review text,
  created_at timestamptz default now(),
  primary key (id)
);

-- Enable RLS
alter table public.member_books enable row level security;

-- Policies
create policy "Users can view their own books"
  on public.member_books for select
  using (auth.uid() = member_id);

create policy "Users can insert their own books"
  on public.member_books for insert
  with check (auth.uid() = member_id);

create policy "Users can update their own books"
  on public.member_books for update
  using (auth.uid() = member_id);

create policy "Users can delete their own books"
  on public.member_books for delete
  using (auth.uid() = member_id);

-- Public read access (optional, for viewing profiles)
create policy "Public can view member books"
  on public.member_books for select
  using (true);
