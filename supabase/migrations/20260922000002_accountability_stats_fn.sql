-- 20260922000002_accountability_stats_fn.sql
-- /api/accountability-stats pulled whole tables through PostgREST, which caps
-- every select at 1,000 rows. That made "Trades on file" read 2,000 (1,000 per
-- table) and silently truncated the trader count, the volume figures and the
-- top-ticker ranking. This moves the aggregation into Postgres.
--
-- It also normalizes the Senate eFD "no ticker" placeholder ('--') to NULL.
-- Left in place, '--' ranked as the #1 "trending ticker" (1,886 rows) and was
-- treated as a real ticker by every `ticker IS NOT NULL` filter.

update public.senate_trades set ticker = null where trim(ticker) = '--';

create or replace function public.fill_senate_bioguide() returns trigger
language plpgsql set search_path = public as $$
declare m record;
begin
  if trim(coalesce(new.ticker, '')) = '--' then
    new.ticker := null;
  end if;
  if new.bioguide_id is null or new.state is null then
    select bioguide_id, state into m
      from public.senate_member_map
     where last_name = new.last_name and first_name = new.first_name;
    if found then
      new.bioguide_id := coalesce(new.bioguide_id, m.bioguide_id);
      new.state       := coalesce(new.state, m.state);
    end if;
  end if;
  return new;
end $$;

-- senate_net_worth has no ticker column, so it needs its own function.
create or replace function public.fill_senate_nw_bioguide() returns trigger
language plpgsql set search_path = public as $$
declare m record;
begin
  if new.bioguide_id is null or new.state is null then
    select bioguide_id, state into m
      from public.senate_member_map
     where last_name = new.last_name and first_name = new.first_name;
    if found then
      new.bioguide_id := coalesce(new.bioguide_id, m.bioguide_id);
      new.state       := coalesce(new.state, m.state);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists senate_net_worth_fill_bioguide on public.senate_net_worth;
create trigger senate_net_worth_fill_bioguide before insert or update of last_name, first_name
  on public.senate_net_worth for each row execute function public.fill_senate_nw_bioguide();

drop trigger if exists senate_trades_fill_bioguide on public.senate_trades;
create trigger senate_trades_fill_bioguide before insert or update of last_name, first_name, ticker
  on public.senate_trades for each row execute function public.fill_senate_bioguide();

create or replace function public.accountability_stats()
returns json language sql stable set search_path = public as $$
  with t as (
    select bioguide_id, upper(trim(ticker)) as ticker, transaction_date, amount_min, amount_max from fd_trades
    union all
    select bioguide_id, upper(trim(ticker)), transaction_date, amount_min, amount_max from senate_trades
  ),
  mid as (
    select *, coalesce((amount_min + coalesce(amount_max, amount_min)) / 2.0, 0) as midpoint from t
  ),
  months as (
    select (date_trunc('month', current_date) - (g || ' months')::interval)::date as mo
    from generate_series(0, 11) g
  ),
  by_month as (
    select date_trunc('month', transaction_date)::date as mo, sum(midpoint) as volume, count(*) as n
    from mid where transaction_date is not null group by 1
  ),
  traders as (
    select bioguide_id from t where bioguide_id is not null
    union
    select bioguide_id from fd_filings where filing_type = 'P' and bioguide_id is not null
  )
  select json_build_object(
    'total_trades', (select count(*) from t),
    'trader_ids', (select coalesce(json_agg(bioguide_id), '[]'::json) from traders),
    'volume_ytd', (select round(coalesce(sum(midpoint), 0)) from mid
                    where transaction_date >= date_trunc('year', current_date) and transaction_date <= current_date),
    'monthly', (select json_agg(json_build_object('key', to_char(m.mo, 'YYYY-MM'),
                                                  'volume', round(coalesce(b.volume, 0)),
                                                  'count', coalesce(b.n, 0)) order by m.mo)
                  from months m left join by_month b on b.mo = m.mo),
    'top_tickers', (select coalesce(json_agg(r), '[]'::json) from (
                      select ticker, count(*) as count from t
                       where ticker ~ '^[A-Z][A-Z.\-]{0,6}$'
                       group by 1 order by 2 desc, 1 limit 8) r)
  );
$$;

revoke all on function public.accountability_stats() from public, anon, authenticated;
