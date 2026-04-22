import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
  const { data, error } = await supabase
    .from('students_results')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching data:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns in students_results:', Object.keys(data[0]))
  } else {
    // If no data, try to fetch from system_config to see if we can at least connect
    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('*')
    
    if (configError) {
       console.error('Error fetching config:', configError)
    } else {
       console.log('Connected to DB. system_config keys:', config.map(c => c.key))
    }
    console.warn('No student results found, cannot infer columns from data.')
  }
}

checkColumns()
