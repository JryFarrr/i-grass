-- Skema i-Grass (frontend Next.js + Supabase + scorng model via Modal API)
-- Jalankan file ini dulu di SQL Editor Supabase, lalu file *_rows.sql (data).

create extension if not exists "pgcrypto";

-- =========================
-- USERS
-- =========================
create table if not exists public.users (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    email         text not null unique,
    password_hash text not null,
    salt          text not null,
    created_at    timestamptz not null default now(),
    role          text not null default 'user' check (role in ('user', 'admin'))
);

-- =========================
-- QUESTIONS
-- =========================
create table if not exists public.questions (
    id     uuid primary key default gen_random_uuid(),
    type   text not null,
    prompt text not null
);

-- =========================
-- SCORES
-- =========================
create table if not exists public.scores (
    id                            uuid primary key default gen_random_uuid(),
    user_id                       uuid not null references public.users(id) on delete cascade,
    task_achievement_average      numeric(4,1) not null,
    coherence_and_cohesion_average numeric(4,1) not null,
    lexical_resource_average       numeric(4,1) not null,
    grammatical_range_average      numeric(4,1) not null,
    created_at                     timestamptz not null default now()
);

create index if not exists scores_user_id_idx on public.scores(user_id);

-- =========================
-- RLS + Policies
-- (app memakai NEXT_PUBLIC_SUPABASE_ANON_KEY dari browser/server Next)
-- Catatan: sesuai desain lama, tabel users dibaca role anon (email + hash) —
-- pertimbangkan Supabase Auth untuk solusi lebih aman.
-- =========================
alter table public.users     enable row level security;
alter table public.questions enable row level security;
alter table public.scores    enable row level security;

drop policy if exists "users_select" on public.users;
create policy "users_select" on public.users for select to anon, authenticated using (true);

drop policy if exists "users_insert" on public.users;
create policy "users_insert" on public.users for insert to anon, authenticated with check (true);

drop policy if exists "questions_select" on public.questions;
create policy "questions_select" on public.questions for select to anon, authenticated using (true);

drop policy if exists "scores_select" on public.scores;
create policy "scores_select" on public.scores for select to anon, authenticated using (true);

drop policy if exists "scores_insert" on public.scores;
create policy "scores_insert" on public.scores for insert to anon, authenticated with check (true);

drop policy if exists "scores_delete" on public.scores;
create policy "scores_delete" on public.scores for delete to anon, authenticated using (true);
