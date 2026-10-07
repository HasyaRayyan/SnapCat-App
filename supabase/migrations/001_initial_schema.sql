-- ========================================================
-- STRAYDEX DATABASE SCHEMA & SETUP
-- Jalankan seluruh script ini di Supabase SQL Editor
-- ========================================================

-- 1. Enable ekstensi yang dibutuhkan
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- 2. Tabel Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text not null,
  email text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Tabel Animal Types (Jenis Anabul)
create table if not exists public.animal_types (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  icon text,
  created_at timestamptz default now() not null,
  user_id uuid references auth.users on delete set null
);

-- 4. Tabel Animals (Koleksi Anabul)
create table if not exists public.animals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type_id uuid references public.animal_types on delete restrict not null,
  description text,
  photo_url text not null,
  photo_no_bg_url text,
  latitude double precision,
  longitude double precision,
  location_name text,
  captured_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. Aktifkan Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.animal_types enable row level security;
alter table public.animals enable row level security;

-- Policies Profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Policies Animal Types
drop policy if exists "Anyone can view animal types" on public.animal_types;
create policy "Anyone can view animal types" on public.animal_types for select using (true);

drop policy if exists "Authenticated users can insert animal types" on public.animal_types;
create policy "Authenticated users can insert animal types" on public.animal_types for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own animal types" on public.animal_types;
create policy "Users can update own animal types" on public.animal_types for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own animal types" on public.animal_types;
create policy "Users can delete own animal types" on public.animal_types for delete using (auth.uid() = user_id);

-- Policies Animals
drop policy if exists "Users can view own animals" on public.animals;
create policy "Users can view own animals" on public.animals for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own animals" on public.animals;
create policy "Users can insert own animals" on public.animals for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own animals" on public.animals;
create policy "Users can update own animals" on public.animals for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own animals" on public.animals;
create policy "Users can delete own animals" on public.animals for delete using (auth.uid() = user_id);

-- 6. Indexes untuk performa
create index if not exists idx_animals_user_id on public.animals(user_id);
create index if not exists idx_animals_type_id on public.animals(type_id);
create index if not exists idx_animals_captured_at on public.animals(captured_at);
create index if not exists idx_animals_name on public.animals(name);
create index if not exists idx_animal_types_user_id on public.animal_types(user_id);
create index if not exists idx_profiles_username on public.profiles(lower(username));

-- 7. Data Default Jenis Anabul
insert into public.animal_types (name, icon) values
  ('Kucing', '🐱'),
  ('Anjing', '🐶'),
  ('Kelinci', '🐰'),
  ('Hamster', '🐹'),
  ('Burung', '🐦'),
  ('Ikan', '🐟'),
  ('Kura-kura', '🐢'),
  ('Lainnya', '🐾')
on conflict (name) do nothing;

-- 8. Fungsi Helper Login: Mendapatkan Email Berdasarkan Username (Security Definer)
create or replace function public.get_email_by_username(p_username text)
returns text as $$
declare
  found_email text;
begin
  select u.email into found_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(p_username)
  limit 1;
  
  return found_email;
end;
$$ language plpgsql security definer;

grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- 9. Trigger untuk Otomatis Membuat Profil saat User Mendaftar
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_username text;
  default_full_name text;
begin
  default_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  default_full_name := coalesce(new.raw_user_meta_data->>'full_name', default_username);

  insert into public.profiles (id, username, full_name, email)
  values (
    new.id,
    lower(default_username),
    default_full_name,
    new.email
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 10. Trigger untuk Otomatis Update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at();

drop trigger if exists update_animals_updated_at on public.animals;
create trigger update_animals_updated_at before update on public.animals for each row execute procedure public.update_updated_at();

-- 11. Storage Bucket untuk Foto Anabul
insert into storage.buckets (id, name, public) 
values ('animal-photos', 'animal-photos', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Authenticated users can upload photos" on storage.objects for insert with check (bucket_id = 'animal-photos' and auth.role() = 'authenticated');

drop policy if exists "Anyone can view photos" on storage.objects;
create policy "Anyone can view photos" on storage.objects for select using (bucket_id = 'animal-photos');

drop policy if exists "Users can delete own photos" on storage.objects;
create policy "Users can delete own photos" on storage.objects for delete using (bucket_id = 'animal-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================================
-- 12. AKUN SIAP PAKAI (BISA LANGSUNG LOGIN TANPA DAFTAR LAGI)
-- Email    : admin@straydex.com
-- Username : admin
-- Password : Password123
-- ========================================================
do $$
declare
  demo_user_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
begin
  if not exists (select 1 from auth.users where email = 'admin@straydex.com') then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      demo_user_id,
      'authenticated',
      'authenticated',
      'admin@straydex.com',
      crypt('Password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"admin","full_name":"Admin StrayDex"}',
      now(),
      now()
    );
  end if;

  insert into public.profiles (id, username, full_name, email)
  values (
    demo_user_id,
    'admin',
    'Admin StrayDex',
    'admin@straydex.com'
  )
  on conflict (id) do nothing;
end $$;
