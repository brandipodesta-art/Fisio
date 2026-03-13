import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log(`Testing connection to: ${supabaseUrl}`);
    // A simple query to test if the REST API allows a basic request
    // We try to fetch the first table that comes to mind or just use the raw rpc or auth endpoints.
    // Auth endpoint is usually available
    const { data, error } = await supabase.auth.getSession();
    
    // We can also just fetch a non-existent table and if it returns a 40x code instead of 5xx, CORS/Network is working!
    const res = await supabase.from('pacientes').select('*').limit(1);

    console.log('--- Auth Test ---');
    console.log(error ? `Auth Error: ${error.message}` : 'Auth check passed.');
    
    console.log('--- Rest / PostgREST Test ---');
    if (res.error) {
       console.log(`Query returned (expected if table doesn't exist): ${res.error.message}`);
       // If it is 42P01 - undefined_table, it means the connection is completely healthy
       if (res.error.code === '42P01' || res.error.code === 'PGRST116') {
         console.log('Connection passed! Submitting queries successfully.');
       }
    } else {
       console.log('Query returned OK.');
    }
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
