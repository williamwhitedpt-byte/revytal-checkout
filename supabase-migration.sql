-- Revytal Automated Checkout — Supabase Schema
-- Run this in your Supabase SQL editor

create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  product_name      text not null,
  sku               text not null,
  supplier          text not null,
  price             numeric(10,2) not null,
  cost              numeric(10,2) not null default 0,
  margin            numeric(10,2) generated always as (price - cost) stored,
  checkout_url      text,
  qr_code_url       text,
  patient_email     text,
  patient_address   text,
  status            text not null default 'pending'
                      check (status in ('pending', 'paid', 'sent_to_supplier')),
  stripe_session_id text unique,
  created_at        timestamptz not null default now()
);

-- Index for webhook lookups
create index if not exists orders_stripe_session_id_idx
  on orders (stripe_session_id);

-- Index for dashboard queries
create index if not exists orders_status_idx
  on orders (status);

create index if not exists orders_created_at_idx
  on orders (created_at desc);

-- Row Level Security (optional but recommended)
alter table orders enable row level security;

-- Allow service role full access (used by your backend)
create policy "Service role can do anything"
  on orders
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
