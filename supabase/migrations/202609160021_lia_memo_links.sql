-- V0.179 — optional structured links for private LIA Mémos.
-- This never turns a Favorite into a Mémo and never stores conversation transcripts.

alter table public.lia_memos
  add column if not exists link_kind text null,
  add column if not exists link_ref text null,
  add column if not exists link_label text null;

alter table public.lia_memos
  drop constraint if exists lia_memos_link_kind_check;
alter table public.lia_memos
  add constraint lia_memos_link_kind_check
  check (link_kind is null or link_kind in ('restaurant','recipe','meal','shopping','commander','family','other'));

alter table public.lia_memos
  drop constraint if exists lia_memos_link_shape_check;
alter table public.lia_memos
  add constraint lia_memos_link_shape_check
  check (
    (link_kind is null and link_ref is null and link_label is null)
    or
    (link_kind is not null
      and link_label is not null
      and char_length(trim(link_label)) between 1 and 120
      and (link_ref is null or char_length(trim(link_ref)) between 1 and 256))
  );
