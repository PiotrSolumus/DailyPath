-- migration: add invitations table for user registration by invitation
-- purpose: store invitation tokens for email-based user registration
-- notes:
-- - invitation tokens are single-use and expire after 7 days
-- - invitation email must not already exist in users table
-- - custom email service will send invitation emails (not Supabase Auth)

-- ============================================================================
-- 1. create invitations table
-- ============================================================================
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  token text not null unique,
  app_role app_role not null default 'employee',
  department_id uuid references public.departments(id) on delete set null,
  invited_by uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitations_email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  constraint invitations_token_not_empty check (token <> ''),
  constraint invitations_expires_in_future check (expires_at > created_at)
);

-- ============================================================================
-- 2. indexes for performance
-- ============================================================================
create index invitations_email_idx on public.invitations(email);
create index invitations_token_idx on public.invitations(token);
create index invitations_expires_at_idx on public.invitations(expires_at);
create index invitations_accepted_at_idx on public.invitations(accepted_at) where accepted_at is not null;

-- ============================================================================
-- 3. rls policies
-- ============================================================================
alter table public.invitations enable row level security;

-- managers and admins can view invitations they sent
create policy "managers_view_own_invitations"
on public.invitations
for select
to authenticated
using (
  invited_by = auth.uid()
  and public.current_app_role() in ('manager', 'admin')
);

-- managers and admins can create invitations
create policy "managers_create_invitations"
on public.invitations
for insert
to authenticated
with check (
  invited_by = auth.uid()
  and public.current_app_role() in ('manager', 'admin')
);

-- admins can view all invitations
create policy "admins_view_all_invitations"
on public.invitations
for select
to authenticated
using (
  public.current_app_role() = 'admin'
);

-- service_role can do anything (for backend operations)
create policy "service_role_full_access_invitations"
on public.invitations
for all
to service_role
using (true)
with check (true);

-- ============================================================================
-- 4. helper function to validate invitation token
-- ============================================================================
create or replace function public.validate_invitation_token(p_token text)
returns table (
  invitation_id uuid,
  email citext,
  app_role app_role,
  department_id uuid,
  is_valid boolean
)
language plpgsql
security definer
as $$
declare
  v_invitation record;
begin
  select
    i.id,
    i.email,
    i.app_role,
    i.department_id,
    i.expires_at,
    i.accepted_at
  into v_invitation
  from public.invitations i
  where i.token = p_token;

  if v_invitation is null then
    return query select null::uuid, null::citext, null::app_role, null::uuid, false;
    return;
  end if;

  if v_invitation.accepted_at is not null then
    return query select v_invitation.id, v_invitation.email, v_invitation.app_role, v_invitation.department_id, false;
    return;
  end if;

  if v_invitation.expires_at < now() then
    return query select v_invitation.id, v_invitation.email, v_invitation.app_role, v_invitation.department_id, false;
    return;
  end if;

  return query select v_invitation.id, v_invitation.email, v_invitation.app_role, v_invitation.department_id, true;
end;
$$;

-- ============================================================================
-- 5. comments for documentation
-- ============================================================================
comment on table public.invitations is 'Stores invitation tokens for user registration by email invitation';
comment on column public.invitations.token is 'Unique, single-use token sent in invitation email';
comment on column public.invitations.expires_at is 'Invitation expiration timestamp (typically 7 days from creation)';
comment on column public.invitations.accepted_at is 'Timestamp when invitation was accepted (user registered)';
