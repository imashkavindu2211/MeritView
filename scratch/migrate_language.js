
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function migrate() {
  console.log("Starting migration: Adding language column...");
  
  // Since we can't run arbitrary SQL easily without a pre-defined RPC, 
  // we'll try to check if we can at least update existing records if the column exists.
  // In a real scenario, the user should run this in Supabase SQL Editor:
  /*
    ALTER TABLE public.students_results ADD COLUMN IF NOT EXISTS language text DEFAULT 'Sinhala';
    UPDATE public.students_results SET language = 'Sinhala' WHERE language IS NULL;
  */

  console.log("Migration script finished. PLEASE RUN THE FOLLOWING SQL IN SUPABASE SQL EDITOR:");
  console.log(`
    ALTER TABLE public.students_results ADD COLUMN IF NOT EXISTS language text DEFAULT 'Sinhala';
    UPDATE public.students_results SET language = 'Sinhala' WHERE language IS NULL;
  `);
}

migrate();
