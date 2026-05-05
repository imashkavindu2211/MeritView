
import { supabaseAdmin } from "../lib/supabase/admin";

async function updateSchema() {
  console.log("Updating database schema...");
  
  // 1. Check if exam_date column exists (it should, based on actions.ts)
  // 2. Drop the old unique constraint and add the new one.
  // Note: We don't know the exact name of the constraint, so we might need to find it or just try common names.
  // In PostgreSQL, it's often students_results_nic_subject_key.
  
  const sql = `
    -- First, ensure exam_date column exists (it likely does but let's be safe if schema.sql was old)
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students_results' AND column_name='exam_date') THEN
            ALTER TABLE public.students_results ADD COLUMN exam_date text;
        END IF;
    END $$;

    -- Drop the existing unique constraint if it exists. 
    -- We'll try to find it dynamically or use the standard name.
    DO $$
    DECLARE
        constraint_name text;
    BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'public.students_results'::regclass
          AND contype = 'u';
          
        IF constraint_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.students_results DROP CONSTRAINT ' || constraint_name;
        END IF;
    END $$;

    -- Add the new combined unique constraint
    ALTER TABLE public.students_results ADD CONSTRAINT students_results_nic_subject_date_key UNIQUE (nic, subject, exam_date);
    
    -- Add index for exam_date for performance
    CREATE INDEX IF NOT EXISTS students_results_exam_date_idx ON public.students_results (exam_date);
  `;

  try {
    // Supabase JS client doesn't have a direct 'rpc' for arbitrary SQL unless a function is created.
    // However, I can try to run it via a temporary function if the user has permissions.
    // Or, I can just assume the user will run it in Supabase SQL editor.
    // Given I'm an agent, I'll try to use the 'run_command' if there's a better way, but usually I can't run SQL directly.
    
    console.log("Please run the following SQL in your Supabase SQL Editor:");
    console.log(sql);
    
  } catch (error) {
    console.error("Error updating schema:", error);
  }
}

updateSchema();
