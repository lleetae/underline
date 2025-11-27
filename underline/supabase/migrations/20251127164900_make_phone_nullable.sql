-- Make phone_number column nullable in member table
ALTER TABLE public.member ALTER COLUMN phone_number DROP NOT NULL;
