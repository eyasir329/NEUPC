const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: contests, error: err } = await supabase
    .from('contest_history')
    .select('*')
    .limit(2);

  if (err) {
    console.error('Error fetching contest_history:', err);
  } else {
    console.log('Sample contest_history:', JSON.stringify(contests, null, 2));
  }

  // Count non-null contest_id in rating_history
  const { data: ratingHist, error: err2 } = await supabase
    .from('rating_history')
    .select('id, contest_id, rating')
    .not('contest_id', 'is', null)
    .limit(5);

  if (err2) {
    console.error('Error fetching rating_history with non-null contest_id:', err2);
  } else {
    console.log('Rating history with non-null contest_id:', JSON.stringify(ratingHist, null, 2));
  }
}

run().catch(console.error);
