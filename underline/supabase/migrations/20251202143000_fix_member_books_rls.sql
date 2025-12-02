-- Drop existing incorrect policies
drop policy if exists "Users can view their own books" on public.member_books;
drop policy if exists "Users can insert their own books" on public.member_books;
drop policy if exists "Users can update their own books" on public.member_books;
drop policy if exists "Users can delete their own books" on public.member_books;

-- Re-create with correct logic joining member table
create policy "Users can view their own books"
  on public.member_books for select
  using (
    member_id in (select id from public.member where auth_id = auth.uid())
  );

create policy "Users can insert their own books"
  on public.member_books for insert
  with check (
    member_id in (select id from public.member where auth_id = auth.uid())
  );

create policy "Users can update their own books"
  on public.member_books for update
  using (
    member_id in (select id from public.member where auth_id = auth.uid())
  );

create policy "Users can delete their own books"
  on public.member_books for delete
  using (
    member_id in (select id from public.member where auth_id = auth.uid())
  );
