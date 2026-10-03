-- CR-2026-10-03-2254: a Trainer's new date waits for an administrator's approval, hidden from the public.
-- Additive: one new enum value; no table or column changes; existing rows untouched.
ALTER TYPE "offering_status" ADD VALUE 'pending_review';
