-- Fix Storage Schema Foreign Keys
-- storage.objects often references auth.users(id) via the 'owner' column.
-- If this is not ON DELETE CASCADE, user deletion will fail if they have any files (even orphaned ones).

DO $$
BEGIN
    -- 1. storage.objects
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_schema = 'storage' 
               AND table_name = 'objects' 
               AND constraint_name = 'objects_owner_fkey') THEN
               
        ALTER TABLE storage.objects DROP CONSTRAINT objects_owner_fkey;
        
        ALTER TABLE storage.objects 
        ADD CONSTRAINT objects_owner_fkey 
        FOREIGN KEY (owner) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
    END IF;

    -- 2. storage.buckets (just in case)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_schema = 'storage' 
               AND table_name = 'buckets' 
               AND constraint_name = 'buckets_owner_fkey') THEN
               
        ALTER TABLE storage.buckets DROP CONSTRAINT buckets_owner_fkey;
        
        ALTER TABLE storage.buckets 
        ADD CONSTRAINT buckets_owner_fkey 
        FOREIGN KEY (owner) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
    END IF;
END $$;
