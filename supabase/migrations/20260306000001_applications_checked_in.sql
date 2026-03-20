-- Batch 9: host confirms guest check-in
alter table applications add column if not exists checked_in boolean not null default false;
