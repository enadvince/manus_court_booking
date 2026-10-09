-- Reference schema for when bookings move off the demo localStorage store
-- (client/src/lib/booking/store.ts). NOT applied anywhere yet.
--
-- The exclusion constraint is what makes double booking impossible at the
-- database level: two non-cancelled bookings on the same court can never have
-- overlapping time ranges, no matter how many clients confirm at once.

create extension if not exists btree_gist;

create table courts (
  id text primary key,            -- 'court-01'
  name text not null,
  active boolean not null default true
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,       -- 'BL-261010-ABCD'
  court_id text not null references courts (id),
  -- Stored as an instant range; the app shows it in Asia/Manila.
  period tstzrange not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled')),
  name text not null,
  mobile text not null,           -- E.164, '+639171234567'
  email text not null,
  notes text not null default '',
  payment text not null check (payment in ('cash', 'qr')),
  payment_status text not null default 'due'
    check (payment_status in ('due', 'submitted', 'verified', 'rejected')),
  proof_path text,                -- storage object for the QR screenshot
  total_php integer not null check (total_php >= 0),
  created_at timestamptz not null default now(),

  constraint bookings_no_overlap
    exclude using gist (court_id with =, period with &&)
    where (status <> 'cancelled')
);

create index bookings_period_idx on bookings using gist (period);
