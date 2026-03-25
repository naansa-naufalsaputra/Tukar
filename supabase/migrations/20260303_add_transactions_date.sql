alter table public.transactions
add column if not exists date timestamptz not null default now();
