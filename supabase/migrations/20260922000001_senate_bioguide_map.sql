-- 20260922000001_senate_bioguide_map.sql
-- Senate eFD rows arrive with no state and no bioguide_id (the ingest's office-regex
-- never matches), so every senator's conflict score saw zero trades. This adds a
-- name -> bioguide map built from unitedstates/congress-legislators (unique match on
-- surname + first name + Senate term overlapping the filing dates), a trigger that
-- fills bioguide_id/state on future inserts, and a one-time backfill.

create table if not exists public.senate_member_map (
  last_name     text not null,
  first_name    text not null,
  bioguide_id   text not null,
  state         text not null,
  official_name text,
  created_at    timestamptz not null default now(),
  primary key (last_name, first_name)
);
alter table public.senate_member_map enable row level security;  -- service role only

insert into public.senate_member_map (last_name, first_name, bioguide_id, state, official_name) values
  ('Alsobrooks', 'Angela D', 'A000382', 'MD', 'Angela D. Alsobrooks'),
  ('Armstrong', 'Alan', 'A000383', 'OK', 'Alan Armstrong'),
  ('BUDD', 'THEODORE P', 'B001305', 'NC', 'Ted Budd'),
  ('Baldwin', 'Tammy', 'B001230', 'WI', 'Tammy Baldwin'),
  ('Banks', 'James', 'B001299', 'IN', 'Jim Banks'),
  ('Barrasso', 'John A', 'B001261', 'WY', 'John Barrasso'),
  ('Bennet', 'Michael F', 'B001267', 'CO', 'Michael F. Bennet'),
  ('Blackburn', 'Marsha', 'B001243', 'TN', 'Marsha Blackburn'),
  ('Blunt Rochester', 'Lisa', 'B001303', 'DE', 'Lisa Blunt Rochester'),
  ('Booker', 'Cory A', 'B001288', 'NJ', 'Cory A. Booker'),
  ('Boozman', 'John', 'B001236', 'AR', 'John Boozman'),
  ('Britt', 'Katie', 'B001319', 'AL', 'Katie Boyd Britt'),
  ('Cantwell', 'Maria', 'C000127', 'WA', 'Maria Cantwell'),
  ('Capito', 'Shelley M', 'C001047', 'WV', 'Shelley Moore Capito'),
  ('Cassidy', 'William', 'C001075', 'LA', 'Bill Cassidy'),
  ('Collins', 'Susan M', 'C001035', 'ME', 'Susan M. Collins'),
  ('Coons', 'Christopher A', 'C001088', 'DE', 'Christopher A. Coons'),
  ('Cornyn', 'John', 'C001056', 'TX', 'John Cornyn'),
  ('Cortez Masto', 'Catherine', 'C001113', 'NV', 'Catherine Cortez Masto'),
  ('Cotton', 'Tom', 'C001095', 'AR', 'Tom Cotton'),
  ('Cramer', 'Kevin J', 'C001096', 'ND', 'Kevin Cramer'),
  ('Crapo', 'Michael D', 'C000880', 'ID', 'Mike Crapo'),
  ('Cruz', 'Rafael E', 'C001098', 'TX', 'Ted Cruz'),
  ('Curtis', 'John R', 'C001114', 'UT', 'John R. Curtis'),
  ('Daines', 'Steve', 'D000618', 'MT', 'Steve Daines'),
  ('Duckworth', 'Ladda Tammy', 'D000622', 'IL', 'Tammy Duckworth'),
  ('Duckworth', 'Tammy', 'D000622', 'IL', 'Tammy Duckworth'),
  ('Ernst', 'Joni K', 'E000295', 'IA', 'Joni Ernst'),
  ('Fetterman', 'John', 'F000479', 'PA', 'John Fetterman'),
  ('Fischer', 'Deb S', 'F000463', 'NE', 'Deb Fischer'),
  ('Fischer', 'Debra S', 'F000463', 'NE', 'Deb Fischer'),
  ('Gallego', 'Ruben', 'G000574', 'AZ', 'Ruben Gallego'),
  ('Gillibrand', 'Kirsten E', 'G000555', 'NY', 'Kirsten E. Gillibrand'),
  ('Grassley', 'Charles E', 'G000386', 'IA', 'Chuck Grassley'),
  ('Hagerty, IV', 'William F', 'H000601', 'TN', 'Bill Hagerty'),
  ('Hassan', 'Maggie', 'H001076', 'NH', 'Margaret Wood Hassan'),
  ('Hawley', 'Joshua D', 'H001089', 'MO', 'Josh Hawley'),
  ('Heinrich', 'Martin', 'H001046', 'NM', 'Martin Heinrich'),
  ('Hickenlooper', 'John W', 'H000273', 'CO', 'John W. Hickenlooper'),
  ('Hirono', 'Mazie K', 'H001042', 'HI', 'Mazie K. Hirono'),
  ('Hoeven', 'John', 'H001061', 'ND', 'John Hoeven'),
  ('Husted', 'Jon A', 'H001104', 'OH', 'Jon Husted'),
  ('Hyde-Smith', 'Cindy', 'H001079', 'MS', 'Cindy Hyde-Smith'),
  ('Johnson', 'Ron', 'J000293', 'WI', 'Ron Johnson'),
  ('Justice, II', 'James Conley', 'J000312', 'WV', 'James C. Justice'),
  ('Kaine', 'Timothy M', 'K000384', 'VA', 'Tim Kaine'),
  ('Kelly', 'Mark E', 'K000377', 'AZ', 'Mark Kelly'),
  ('Kennedy', 'John N', 'K000393', 'LA', 'John Kennedy'),
  ('Kim', 'Andy', 'K000394', 'NJ', 'Andy Kim'),
  ('King, Jr.', 'Angus S', 'K000383', 'ME', 'Angus S. King, Jr.'),
  ('Klobuchar', 'Amy  J', 'K000367', 'MN', 'Amy Klobuchar'),
  ('Klobuchar', 'Amy J', 'K000367', 'MN', 'Amy Klobuchar'),
  ('Lankford', 'James P', 'L000575', 'OK', 'James Lankford'),
  ('Lee', 'Michael S', 'L000577', 'UT', 'Mike Lee'),
  ('Lujan', 'Ben Ray', 'L000570', 'NM', 'Ben Ray Luján'),
  ('Lummis', 'Cynthia M', 'L000571', 'WY', 'Cynthia M. Lummis'),
  ('Markey', 'Edward J', 'M000133', 'MA', 'Edward J. Markey'),
  ('Marshall', 'Roger W', 'M001198', 'KS', 'Roger Marshall'),
  ('McConnell', 'Mitchell A', 'M000355', 'KY', 'Mitch McConnell'),
  ('McConnell, Jr.', 'A. Mitchell', 'M000355', 'KY', 'Mitch McConnell'),
  ('McCormick', 'David H', 'M001243', 'PA', 'David McCormick'),
  ('Merkley', 'Jeffrey A', 'M001176', 'OR', 'Jeff Merkley'),
  ('Moody', 'Ashley', 'M001244', 'FL', 'Ashley Moody'),
  ('Moran,', 'Jerry', 'M000934', 'KS', 'Jerry Moran'),
  ('Moreno', 'Bernie', 'M001242', 'OH', 'Bernie Moreno'),
  ('Murkowski', 'Lisa A', 'M001153', 'AK', 'Lisa Murkowski'),
  ('Murphy', 'Christopher', 'M001169', 'CT', 'Christopher Murphy'),
  ('Murray', 'Patty', 'M001111', 'WA', 'Patty Murray'),
  ('Ossoff', 'Thomas J', 'O000174', 'GA', 'Jon Ossoff'),
  ('Padilla', 'Alex', 'P000145', 'CA', 'Alex Padilla'),
  ('Paul', 'Rand', 'P000603', 'KY', 'Rand Paul'),
  ('Peters', 'Gary C', 'P000595', 'MI', 'Gary C. Peters'),
  ('Reed', 'John F', 'R000122', 'RI', 'Jack Reed'),
  ('Ricketts', 'John P', 'R000618', 'NE', 'Pete Ricketts'),
  ('Risch', 'James E', 'R000584', 'ID', 'James E. Risch'),
  ('Rosen', 'Jacklyn S', 'R000608', 'NV', 'Jacky Rosen'),
  ('Rounds', 'M. Michael', 'R000605', 'SD', 'Mike Rounds'),
  ('Rounds', 'Mike', 'R000605', 'SD', 'Mike Rounds'),
  ('Sanders', 'Bernard', 'S000033', 'VT', 'Bernard Sanders'),
  ('Schatz', 'Brian E', 'S001194', 'HI', 'Brian Schatz'),
  ('Schiff', 'Adam B', 'S001150', 'CA', 'Adam B. Schiff'),
  ('Schmitt', 'Eric', 'S001227', 'MO', 'Eric Schmitt'),
  ('Schumer', 'Charles E', 'S000148', 'NY', 'Charles E. Schumer'),
  ('Scott', 'Rick', 'S001217', 'FL', 'Rick Scott'),
  ('Scott', 'Tim', 'S001184', 'SC', 'Tim Scott'),
  ('Shaheen', 'Jeanne', 'S001181', 'NH', 'Jeanne Shaheen'),
  ('Sheehy', 'Timothy P', 'S001232', 'MT', 'Tim Sheehy'),
  ('Slotkin', 'Elissa', 'S001208', 'MI', 'Elissa Slotkin'),
  ('Smith', 'Tina', 'S001203', 'MN', 'Tina Smith'),
  ('Sullivan', 'Daniel S', 'S001198', 'AK', 'Dan Sullivan'),
  ('Thune', 'John R', 'T000250', 'SD', 'John Thune'),
  ('Tillis', 'Thomas R', 'T000476', 'NC', 'Thom Tillis'),
  ('Tuberville', 'Thomas H', 'T000278', 'AL', 'Tommy Tuberville'),
  ('Van Hollen', 'Chris', 'V000128', 'MD', 'Chris Van Hollen'),
  ('Warner', 'Mark R', 'W000805', 'VA', 'Mark R. Warner'),
  ('Warnock', 'Raphael', 'W000790', 'GA', 'Raphael G. Warnock'),
  ('Warren', 'Elizabeth', 'W000817', 'MA', 'Elizabeth Warren'),
  ('Welch', 'Peter', 'W000800', 'VT', 'Peter Welch'),
  ('Whitehouse', 'Sheldon', 'W000802', 'RI', 'Sheldon Whitehouse'),
  ('Wicker', 'Roger F', 'W000437', 'MS', 'Roger F. Wicker'),
  ('Wyden', 'Ron', 'W000779', 'OR', 'Ron Wyden'),
  ('Wyden', 'Ron L', 'W000779', 'OR', 'Ron Wyden'),
  ('Young', 'Todd', 'Y000064', 'IN', 'Todd Young')
on conflict (last_name, first_name) do update
  set bioguide_id = excluded.bioguide_id, state = excluded.state, official_name = excluded.official_name;

create or replace function public.fill_senate_bioguide() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.bioguide_id is null or new.state is null then
    select coalesce(new.bioguide_id, m.bioguide_id), coalesce(new.state, m.state)
      into new.bioguide_id, new.state
      from public.senate_member_map m
     where m.last_name = new.last_name and m.first_name = new.first_name;
  end if;
  return new;
end $$;

drop trigger if exists senate_trades_fill_bioguide on public.senate_trades;
create trigger senate_trades_fill_bioguide before insert or update of last_name, first_name
  on public.senate_trades for each row execute function public.fill_senate_bioguide();

drop trigger if exists senate_net_worth_fill_bioguide on public.senate_net_worth;
create trigger senate_net_worth_fill_bioguide before insert or update of last_name, first_name
  on public.senate_net_worth for each row execute function public.fill_senate_bioguide();

-- one-time backfill
update public.senate_trades t set bioguide_id = m.bioguide_id, state = coalesce(t.state, m.state)
  from public.senate_member_map m
 where t.bioguide_id is null and m.last_name = t.last_name and m.first_name = t.first_name;

update public.senate_net_worth t set bioguide_id = m.bioguide_id, state = coalesce(t.state, m.state)
  from public.senate_member_map m
 where t.bioguide_id is null and m.last_name = t.last_name and m.first_name = t.first_name;
