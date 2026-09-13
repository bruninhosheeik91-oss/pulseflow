-- ============================================================
-- PULSE FLOW — multi-tenant foundation schema (public)
-- ============================================================

begin;

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text,
  role text not null default 'OWNER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('OWNER', 'ADMIN', 'MEMBER'))
);

create table if not exists public.whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  session_id text not null,
  name text not null,
  status text not null default 'DISCONNECTED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_accounts_tenant_session_key unique (tenant_id, session_id)
);

create table if not exists public.whatsapp_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  whatsapp_account_id uuid not null references public.whatsapp_accounts (id) on delete cascade,
  group_id text not null,
  name text not null,
  participant_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_groups_account_group_key unique (whatsapp_account_id, group_id)
);

create table if not exists public.affiliate_credentials (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  marketplace text not null,
  credentials_encrypted text not null,
  auto_generate_links boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_credentials_tenant_marketplace_key unique (tenant_id, marketplace)
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  type text not null,
  marketplace text,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automations_type_check check (type in ('AUTO_SEARCH', 'LINK_LIST', 'MIRROR', 'MONITOR_GROUP'))
);

create table if not exists public.automation_destinations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  automation_id uuid not null references public.automations (id) on delete cascade,
  whatsapp_account_id uuid not null references public.whatsapp_accounts (id) on delete cascade,
  whatsapp_group_id uuid not null references public.whatsapp_groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint automation_destinations_automation_group_key unique (automation_id, whatsapp_group_id)
);

create table if not exists public.automation_sends (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  automation_id uuid references public.automations (id) on delete set null,
  whatsapp_account_id uuid references public.whatsapp_accounts (id) on delete set null,
  whatsapp_group_id uuid references public.whatsapp_groups (id) on delete set null,
  marketplace text,
  item_id text,
  product_name text,
  affiliate_url text,
  status text not null,
  error text,
  message_id text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_profiles_tenant_id
  on public.profiles (tenant_id);

create index if not exists idx_whatsapp_groups_tenant_id
  on public.whatsapp_groups (tenant_id);

create index if not exists idx_automations_tenant_id
  on public.automations (tenant_id);

create index if not exists idx_automation_destinations_tenant_id
  on public.automation_destinations (tenant_id);

create index if not exists idx_automation_destinations_whatsapp_account_id
  on public.automation_destinations (whatsapp_account_id);

create index if not exists idx_automation_destinations_whatsapp_group_id
  on public.automation_destinations (whatsapp_group_id);

create index if not exists idx_automation_sends_tenant_id
  on public.automation_sends (tenant_id);

create index if not exists idx_automation_sends_automation_id
  on public.automation_sends (automation_id);

create index if not exists idx_automation_sends_whatsapp_account_id
  on public.automation_sends (whatsapp_account_id);

create index if not exists idx_automation_sends_whatsapp_group_id
  on public.automation_sends (whatsapp_group_id);

create index if not exists idx_automation_sends_sent_at
  on public.automation_sends (sent_at);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.get_user_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.tenant_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_user_tenant_id() from public;
grant execute on function public.get_user_tenant_id() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

-- ============================================================
-- TRIGGERS (updated_at)
-- ============================================================

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger whatsapp_accounts_set_updated_at
  before update on public.whatsapp_accounts
  for each row execute function public.set_updated_at();

create trigger whatsapp_groups_set_updated_at
  before update on public.whatsapp_groups
  for each row execute function public.set_updated_at();

create trigger affiliate_credentials_set_updated_at
  before update on public.affiliate_credentials
  for each row execute function public.set_updated_at();

create trigger automations_set_updated_at
  before update on public.automations
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.whatsapp_accounts enable row level security;
alter table public.whatsapp_groups enable row level security;
alter table public.affiliate_credentials enable row level security;
alter table public.automations enable row level security;
alter table public.automation_destinations enable row level security;
alter table public.automation_sends enable row level security;

-- ============================================================
-- POLICIES — profiles: cada usuário gerencia o próprio perfil
-- ============================================================

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (id = auth.uid());

-- ============================================================
-- POLICIES — demais tabelas: CRUD restrito ao próprio tenant
-- ============================================================

create policy "tenants_select"
  on public.tenants for select
  to authenticated
  using (id = public.get_user_tenant_id());

create policy "tenants_insert"
  on public.tenants for insert
  to authenticated
  with check (id = public.get_user_tenant_id());

create policy "tenants_update"
  on public.tenants for update
  to authenticated
  using (id = public.get_user_tenant_id())
  with check (id = public.get_user_tenant_id());

create policy "tenants_delete"
  on public.tenants for delete
  to authenticated
  using (id = public.get_user_tenant_id());

create policy "whatsapp_accounts_select"
  on public.whatsapp_accounts for select
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "whatsapp_accounts_insert"
  on public.whatsapp_accounts for insert
  to authenticated
  with check (tenant_id = public.get_user_tenant_id());

create policy "whatsapp_accounts_update"
  on public.whatsapp_accounts for update
  to authenticated
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

create policy "whatsapp_accounts_delete"
  on public.whatsapp_accounts for delete
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "whatsapp_groups_select"
  on public.whatsapp_groups for select
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "whatsapp_groups_insert"
  on public.whatsapp_groups for insert
  to authenticated
  with check (tenant_id = public.get_user_tenant_id());

create policy "whatsapp_groups_update"
  on public.whatsapp_groups for update
  to authenticated
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

create policy "whatsapp_groups_delete"
  on public.whatsapp_groups for delete
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "affiliate_credentials_select"
  on public.affiliate_credentials for select
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "affiliate_credentials_insert"
  on public.affiliate_credentials for insert
  to authenticated
  with check (tenant_id = public.get_user_tenant_id());

create policy "affiliate_credentials_update"
  on public.affiliate_credentials for update
  to authenticated
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

create policy "affiliate_credentials_delete"
  on public.affiliate_credentials for delete
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "automations_select"
  on public.automations for select
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "automations_insert"
  on public.automations for insert
  to authenticated
  with check (tenant_id = public.get_user_tenant_id());

create policy "automations_update"
  on public.automations for update
  to authenticated
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

create policy "automations_delete"
  on public.automations for delete
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "automation_destinations_select"
  on public.automation_destinations for select
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "automation_destinations_insert"
  on public.automation_destinations for insert
  to authenticated
  with check (tenant_id = public.get_user_tenant_id());

create policy "automation_destinations_update"
  on public.automation_destinations for update
  to authenticated
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

create policy "automation_destinations_delete"
  on public.automation_destinations for delete
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "automation_sends_select"
  on public.automation_sends for select
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "automation_sends_insert"
  on public.automation_sends for insert
  to authenticated
  with check (tenant_id = public.get_user_tenant_id());

create policy "automation_sends_update"
  on public.automation_sends for update
  to authenticated
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

create policy "automation_sends_delete"
  on public.automation_sends for delete
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

commit;