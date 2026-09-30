-- WAF block log + escalating IP bans ("fail2ban" step of the hardening protocol).
--
-- Written by lib/security/bans.js through the service-role key only. RLS is on
-- with NO policies, so the anon/authenticated roles can neither read nor write
-- either table. The proxy fails OPEN if these objects are missing, so deploying
-- the app code before applying this migration is safe (protection just isn't on).

create table if not exists public.security_events (
  id          bigint generated always as identity primary key,
  ip          text        not null,
  rule        text        not null,
  path        text,
  created_at  timestamptz not null default now()
);
create index if not exists security_events_ip_created_idx on public.security_events (ip, created_at desc);
create index if not exists security_events_created_idx    on public.security_events (created_at desc);

create table if not exists public.ip_bans (
  ip           text primary key,
  strikes      int         not null default 0,
  banned_until timestamptz not null,
  reason       text,
  updated_at   timestamptz not null default now()
);
create index if not exists ip_bans_until_idx on public.ip_bans (banned_until);

alter table public.security_events enable row level security;
alter table public.ip_bans         enable row level security;

-- One round trip per blocked request: log it, count recent blocks, and ban the IP
-- when it crosses the threshold. Atomic, so parallel serverless instances can't
-- double-ban or miscount.
--   threshold : 5 blocks from one IP inside 10 minutes
--   duration  : 15 min * 4^(strikes-1)  ->  15m, 1h, 4h, 16h, then capped at 7d
--   decay     : strikes reset if the IP's last ban ended more than 30 days ago
create or replace function public.security_record_block(p_ip text, p_rule text, p_path text)
returns table (out_banned_until timestamptz, out_new_ban boolean, out_ip_blocks int, out_global_blocks int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip      int;
  v_global  int;
  v_active  timestamptz;
  v_strikes int;
  v_prev    timestamptz;
  v_until   timestamptz;
begin
  insert into security_events (ip, rule, path) values (p_ip, p_rule, left(p_path, 300));

  select count(*) into v_ip     from security_events where ip = p_ip and created_at > now() - interval '10 minutes';
  select count(*) into v_global from security_events where created_at > now() - interval '10 minutes';

  select b.banned_until into v_active from ip_bans b where b.ip = p_ip and b.banned_until > now();

  if v_ip >= 5 and v_active is null then
    select b.strikes, b.banned_until into v_strikes, v_prev from ip_bans b where b.ip = p_ip;
    if v_prev is not null and v_prev < now() - interval '30 days' then v_strikes := 0; end if;
    v_strikes := coalesce(v_strikes, 0) + 1;
    v_until   := now() + least(interval '15 minutes' * power(4, v_strikes - 1), interval '7 days');

    insert into ip_bans (ip, strikes, banned_until, reason, updated_at)
    values (p_ip, v_strikes, v_until, p_rule, now())
    on conflict (ip) do update
      set strikes = excluded.strikes, banned_until = excluded.banned_until,
          reason = excluded.reason, updated_at = now();

    return query select v_until, true, v_ip, v_global;
  else
    return query select v_active, false, v_ip, v_global;
  end if;

  -- Housekeeping without a cron job: ~1% of calls prune old log rows.
  if random() < 0.01 then
    delete from security_events where created_at < now() - interval '7 days';
  end if;
end;
$$;

revoke all on function public.security_record_block(text, text, text) from public, anon, authenticated;
grant execute on function public.security_record_block(text, text, text) to service_role;
