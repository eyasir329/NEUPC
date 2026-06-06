const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: contests, error } = await supabase
    .from('contest_history')
    .select('contest_name, platform_id, rank, rating_change, problems_solved, total_problems, problems_data')
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('CONTESTS SAMPLE:');
  contests.forEach((c, idx) => {
    console.log(`\n--- Contest ${idx + 1} ---`);
    console.log('Name:', c.contest_name);
    console.log('Platform ID:', c.platform_id);
    console.log('Rank:', c.rank);
    console.log('Rating Change:', c.rating_change);
    console.log('Problems Solved:', c.problems_solved);
    console.log('Total Problems:', c.total_problems);
    console.log('Problems Data:', JSON.stringify(c.problems_data));
  });
}

run().catch(console.error);
