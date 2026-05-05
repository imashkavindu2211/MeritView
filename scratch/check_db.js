
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkDatabase() {
  console.log("Checking students_results table...");
  
  // Try to get column info
  const { data: columns, error: colError } = await supabase.rpc('get_table_info', { t_name: 'students_results' });
  
  if (colError) {
    console.log("Error using RPC get_table_info. Falling back to direct query.");
    // Direct query for constraints
    const { data: constraints, error: conError } = await supabase.from('students_results').select('id').limit(1);
    if (conError) {
        console.error("Database access error:", conError);
        return;
    }
    console.log("Database connection successful.");
  } else {
    console.log("Columns:", columns);
  }

  // Since I can't easily see constraints via JS client without RPC,
  // I will try to run the ALTER TABLE command via an RPC if it exists,
  // or I will just confirm if I can create a temporary function to run SQL.
  
  console.log("Attempting to fix unique constraint...");
  
  const sql = `
    DO $$
    DECLARE
        constraint_name text;
    BEGIN
        -- Find the unique constraint name for (nic, subject)
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'public.students_results'::regclass
          AND contype = 'u';
          
        IF constraint_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.students_results DROP CONSTRAINT ' || constraint_name;
        END IF;

        -- Add the new combined unique constraint
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conrelid = 'public.students_results'::regclass 
            AND conname = 'students_results_nic_subject_date_key'
        ) THEN
            ALTER TABLE public.students_results ADD CONSTRAINT students_results_nic_subject_date_key UNIQUE (nic, subject, exam_date);
        END IF;
    END $$;
  `;

  // Note: Supabase doesn't allow arbitrary SQL execution via the client.
  // The user MUST run this in the SQL editor.
}

checkDatabase();
