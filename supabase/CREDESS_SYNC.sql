-- ============================================================
-- CREDESS CONSTRUCTION — SYNCHRONISATION ADMIN <-> SITE PUBLIC
-- À exécuter UNE FOIS dans Supabase > SQL Editor.
-- Ce script conserve les données existantes et ajoute seulement
-- les colonnes/tables/politiques manquantes.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- SERVICES
-- ============================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  description text,
  image_url text,
  whatsapp_message text,
  sort_order integer default 0,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.services add column if not exists short_description text;
alter table public.services add column if not exists description text;
alter table public.services add column if not exists image_url text;
alter table public.services add column if not exists whatsapp_message text;
alter table public.services add column if not exists sort_order integer default 0;
alter table public.services add column if not exists is_published boolean default true;
alter table public.services add column if not exists created_at timestamptz default now();
alter table public.services add column if not exists updated_at timestamptz default now();

-- ============================================================
-- ÉQUIPE — compatibilité avec la structure historique full_name
-- ============================================================
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null,
  photo_url text,
  biography text,
  phone text,
  email text,
  sort_order integer default 0,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.team_members add column if not exists full_name text;
alter table public.team_members add column if not exists role text;
alter table public.team_members add column if not exists photo_url text;
alter table public.team_members add column if not exists biography text;
alter table public.team_members add column if not exists phone text;
alter table public.team_members add column if not exists email text;
alter table public.team_members add column if not exists sort_order integer default 0;
alter table public.team_members add column if not exists is_published boolean default true;
alter table public.team_members add column if not exists created_at timestamptz default now();
alter table public.team_members add column if not exists updated_at timestamptz default now();

-- Si une ancienne colonne name existe, recopier sa valeur vers full_name.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='team_members' and column_name='name'
  ) then
    execute 'update public.team_members set full_name = coalesce(full_name, name) where full_name is null';
  end if;
end $$;

-- ============================================================
-- STATISTIQUES
-- ============================================================
create table if not exists public.company_stats (
  id uuid primary key default gen_random_uuid(),
  stat_key text not null unique,
  label text not null,
  value integer default 0,
  suffix text default '',
  sort_order integer default 0,
  is_published boolean default true,
  updated_at timestamptz default now()
);

alter table public.company_stats add column if not exists suffix text default '';
alter table public.company_stats add column if not exists sort_order integer default 0;
alter table public.company_stats add column if not exists is_published boolean default true;
alter table public.company_stats add column if not exists updated_at timestamptz default now();

-- ============================================================
-- CONTENU DES PAGES
-- ============================================================
create table if not exists public.page_contents (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  title text,
  subtitle text,
  content text,
  sort_order integer default 0,
  is_published boolean default true,
  updated_at timestamptz default now(),
  unique(page_key, section_key)
);

alter table public.page_contents add column if not exists title text;
alter table public.page_contents add column if not exists subtitle text;
alter table public.page_contents add column if not exists content text;
alter table public.page_contents add column if not exists sort_order integer default 0;
alter table public.page_contents add column if not exists is_published boolean default true;
alter table public.page_contents add column if not exists updated_at timestamptz default now();

-- ============================================================
-- PARAMÈTRES
-- ============================================================
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value text,
  updated_at timestamptz default now()
);

alter table public.site_settings add column if not exists setting_value text;
alter table public.site_settings add column if not exists updated_at timestamptz default now();

-- ============================================================
-- QUESTIONS DEVIS
-- ============================================================
create table if not exists public.quote_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  question_type text not null default 'choice',
  options jsonb default '[]'::jsonb,
  placeholder text,
  is_required boolean default true,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.quote_questions add column if not exists question_type text default 'choice';
alter table public.quote_questions add column if not exists options jsonb default '[]'::jsonb;
alter table public.quote_questions add column if not exists placeholder text;
alter table public.quote_questions add column if not exists is_required boolean default true;
alter table public.quote_questions add column if not exists sort_order integer default 0;
alter table public.quote_questions add column if not exists is_active boolean default true;
alter table public.quote_questions add column if not exists created_at timestamptz default now();
alter table public.quote_questions add column if not exists updated_at timestamptz default now();

-- ============================================================
-- DEMANDES DE DEVIS
-- ============================================================
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text unique,
  client_name text,
  phone text,
  email text,
  answers jsonb default '{}'::jsonb,
  pdf_url text,
  status text default 'nouveau',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.quote_requests add column if not exists answers jsonb default '{}'::jsonb;
alter table public.quote_requests add column if not exists pdf_url text;
alter table public.quote_requests add column if not exists status text default 'nouveau';
alter table public.quote_requests add column if not exists created_at timestamptz default now();
alter table public.quote_requests add column if not exists updated_at timestamptz default now();

-- ============================================================
-- INDEX UNIQUES POUR LES UPSERT
-- ============================================================
create unique index if not exists services_slug_uidx on public.services(slug);
create unique index if not exists company_stats_key_uidx on public.company_stats(stat_key);
create unique index if not exists page_contents_page_section_uidx on public.page_contents(page_key,section_key);
create unique index if not exists site_settings_key_uidx on public.site_settings(setting_key);
create unique index if not exists quote_requests_reference_uidx on public.quote_requests(reference);

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================
insert into public.company_stats(stat_key,label,value,suffix,sort_order,is_published)
values
  ('projects','Projets réalisés',128,'+',1,true),
  ('experience','Années d''expérience',8,'+',2,true),
  ('clients','Clients satisfaits',96,'%',3,true),
  ('team','Collaborateurs',24,'',4,true)
on conflict (stat_key) do nothing;

insert into public.site_settings(setting_key,setting_value)
values
  ('company_name','CREDESS Construction'),
  ('location','Bukavu, Sud-Kivu'),
  ('phone',''),
  ('whatsapp',''),
  ('email',''),
  ('copyright','© 2026 CREDESS Construction'),
  ('footer_credit','KrossNumérique')
on conflict (setting_key) do nothing;

insert into public.page_contents(page_key,section_key,title,content,sort_order,is_published)
values
  ('about','main','À propos de nous',E'CREDESS Construction est une entreprise spécialisée dans la construction, l''architecture, les études techniques et l''ingénierie.\n\nNous accompagnons nos clients depuis la conception de leur projet jusqu''à sa réalisation, avec une attention particulière portée à la qualité, à la fiabilité des travaux, au respect des choix du client et au suivi de chaque étape.',1,true),
  ('mission','main','Notre mission',E'La mission de CREDESS Construction est d''accompagner chaque client dans la transformation de son idée en un projet concret, réalisable et durable.',1,true),
  ('engagement','main','Notre engagement',E'CREDESS Construction s''engage à assurer un suivi sérieux de chaque projet et à maintenir une communication claire avec le client durant les différentes étapes des travaux.',1,true),
  ('privacy','main','Politique de confidentialité','Présentez ici la manière dont CREDESS Construction traite les informations transmises par les visiteurs.',1,true),
  ('legal','main','Mentions légales','Ajoutez ici les informations légales et administratives de CREDESS Construction.',1,true),
  ('terms','main','Conditions d’utilisation','Ajoutez ici les conditions applicables à l''utilisation du site et de ses services.',1,true)
on conflict (page_key,section_key) do nothing;

insert into public.services(title,slug,short_description,description,image_url,sort_order,is_published)
values
  ('Construction','construction','Maisons, villas, immeubles et bâtiments professionnels.','CREDESS Construction prend en charge la réalisation de vos ouvrages depuis la préparation du chantier jusqu''aux travaux de finition.','/images/projets/credess-05.png',1,true),
  ('Architecture','architecture','Conception architecturale, plans et modélisation 3D.','Nous concevons des projets architecturaux modernes, fonctionnels et adaptés au terrain, au budget et aux besoins du client.','/images/projets/credess-01.png',2,true),
  ('Études techniques','etudes-techniques','Dimensionnement, métrés, estimation et préparation technique.','Nos études techniques permettent de préparer correctement le projet avant l''exécution et de mieux maîtriser les contraintes du chantier.','/images/projets/credess-06.png',3,true),
  ('Ingénierie','ingenierie','Solutions techniques et accompagnement professionnel.','CREDESS apporte une expertise technique pour accompagner la conception, la préparation et l''exécution des projets de construction.','/images/projets/credess-07.png',4,true),
  ('Suivi de chantier','suivi-chantier','Contrôle et suivi de l''évolution des travaux.','Nous assurons le suivi du chantier afin de contrôler l''évolution des travaux, la qualité d''exécution et le respect des choix validés.','/images/projets/credess-09.png',5,true),
  ('Rénovation','renovation','Réhabilitation et modernisation de bâtiments existants.','Nous transformons et modernisons les bâtiments existants afin d''améliorer leur apparence, leur confort et leur fonctionnalité.','/images/projets/credess-08.png',6,true)
on conflict (slug) do nothing;

insert into public.quote_questions(question,question_type,options,placeholder,is_required,sort_order,is_active)
select * from (
  values
    ('Quel service recherchez-vous ?','choice','["Construction","Plan architectural","Modélisation 3D","Études techniques","Suivi de chantier","Rénovation","Autre"]'::jsonb,null,true,1,true),
    ('Quel type de bâtiment ?','choice','["Maison","Villa","Immeuble","Boutique / Commerce","Bureau","École","Église","Autre"]'::jsonb,null,true,2,true),
    ('Où se trouve votre projet ?','text','[]'::jsonb,'Ex. Bukavu, Ibanda',true,3,true),
    ('Combien de niveaux prévoyez-vous ?','choice','["RDC","R+1","R+2","R+3","R+4 ou plus","Je ne sais pas encore"]'::jsonb,null,false,4,true),
    ('Quelle est la surface approximative ?','text','[]'::jsonb,'Ex. 300 m²',false,5,true),
    ('Décrivez-nous votre projet','textarea','[]'::jsonb,'Décrivez le projet...',true,6,true),
    ('Quel est votre budget approximatif ?','choice','["Moins de 10 000 $","10 000 – 30 000 $","30 000 – 50 000 $","50 000 – 100 000 $","Plus de 100 000 $","Je ne sais pas encore"]'::jsonb,null,false,7,true),
    ('Quand souhaitez-vous commencer ?','choice','["Dès que possible","Dans 1 à 3 mois","Dans 3 à 6 mois","Plus tard","Je souhaite seulement une estimation"]'::jsonb,null,false,8,true)
) as seed(question,question_type,options,placeholder,is_required,sort_order,is_active)
where not exists (select 1 from public.quote_questions);

-- ============================================================
-- RLS : LECTURE PUBLIQUE + ADMINISTRATION
-- Nécessite la fonction public.is_admin() déjà utilisée par CREDESS.
-- ============================================================
alter table public.services enable row level security;
alter table public.team_members enable row level security;
alter table public.company_stats enable row level security;
alter table public.page_contents enable row level security;
alter table public.site_settings enable row level security;
alter table public.quote_questions enable row level security;
alter table public.quote_requests enable row level security;

-- SERVICES
drop policy if exists "credess_services_public" on public.services;
drop policy if exists "credess_services_admin" on public.services;
create policy "credess_services_public" on public.services for select to anon, authenticated using (is_published = true or public.is_admin());
create policy "credess_services_admin" on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- TEAM
drop policy if exists "credess_team_public" on public.team_members;
drop policy if exists "credess_team_admin" on public.team_members;
create policy "credess_team_public" on public.team_members for select to anon, authenticated using (is_published = true or public.is_admin());
create policy "credess_team_admin" on public.team_members for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- STATS
drop policy if exists "credess_stats_public" on public.company_stats;
drop policy if exists "credess_stats_admin" on public.company_stats;
create policy "credess_stats_public" on public.company_stats for select to anon, authenticated using (is_published = true or public.is_admin());
create policy "credess_stats_admin" on public.company_stats for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- PAGES
drop policy if exists "credess_pages_public" on public.page_contents;
drop policy if exists "credess_pages_admin" on public.page_contents;
create policy "credess_pages_public" on public.page_contents for select to anon, authenticated using (is_published = true or public.is_admin());
create policy "credess_pages_admin" on public.page_contents for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- SETTINGS : volontairement lisibles publiquement (coordonnées du site)
drop policy if exists "credess_settings_public" on public.site_settings;
drop policy if exists "credess_settings_admin" on public.site_settings;
create policy "credess_settings_public" on public.site_settings for select to anon, authenticated using (true);
create policy "credess_settings_admin" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- QUESTIONS DEVIS
drop policy if exists "credess_questions_public" on public.quote_questions;
drop policy if exists "credess_questions_admin" on public.quote_questions;
create policy "credess_questions_public" on public.quote_questions for select to anon, authenticated using (is_active = true or public.is_admin());
create policy "credess_questions_admin" on public.quote_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- DEMANDES DE DEVIS : uniquement admin en lecture/modification.
-- Le site public insère via l'API serveur avec SUPABASE_SECRET_KEY.
drop policy if exists "credess_quotes_admin" on public.quote_requests;
create policy "credess_quotes_admin" on public.quote_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- STORAGE bucket projects : lecture publique, écriture admin
-- ============================================================
insert into storage.buckets(id,name,public)
values ('projects','projects',true)
on conflict (id) do update set public = true;

drop policy if exists "credess_projects_storage_public" on storage.objects;
drop policy if exists "credess_projects_storage_admin_insert" on storage.objects;
drop policy if exists "credess_projects_storage_admin_update" on storage.objects;
drop policy if exists "credess_projects_storage_admin_delete" on storage.objects;

create policy "credess_projects_storage_public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'projects');

create policy "credess_projects_storage_admin_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'projects' and public.is_admin());

create policy "credess_projects_storage_admin_update"
on storage.objects for update
to authenticated
using (bucket_id = 'projects' and public.is_admin())
with check (bucket_id = 'projects' and public.is_admin());

create policy "credess_projects_storage_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'projects' and public.is_admin());

notify pgrst, 'reload schema';
