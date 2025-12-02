create table if not exists public.payments (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  match_id uuid not null references public.match_requests(id),
  amount integer not null,
  status text not null,
  payment_method text,
  transaction_id text,
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);
