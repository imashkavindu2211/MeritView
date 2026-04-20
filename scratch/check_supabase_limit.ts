
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLimit() {
  const { data, count, error } = await supabase
    .from('students_results')
    .select('id', { count: 'exact' })
    .limit(200000);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total count in DB:', count);
  console.log('Rows returned with limit(200000):', data?.length);
}

checkLimit();
