const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: user, error } = await supabase.from('users').select('*').eq('id', '4d4f226e-3324-4680-936e-25c8e4aa41df').single();
  if (error) {
    console.error('Error fetching user:', error);
    return;
  }
  console.log('USER:', user);
}

run().catch(console.error);
