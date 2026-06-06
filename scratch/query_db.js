const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: contests, error: err3 } = await supabase.from('contest_history').select('*, platforms(code, name)');
  if (err3) {
    console.error('Error fetching contests:', err3);
    return;
  }
  console.log('Total contests fetched:', contests.length);
  const platformCounts = {};
  contests.forEach(c => {
    const code = c.platforms?.code || 'unknown';
    platformCounts[code] = (platformCounts[code] || 0) + 1;
  });
  console.log('CONTEST COUNTS BY PLATFORM:', platformCounts);
}

run().catch(console.error);
