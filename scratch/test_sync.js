const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Set environment variables for services (they might need them)
process.env.CLIST_API_KEY = '77f8ec236db16fcfaab950e181467a840e947d15';
process.env.CLIST_USERNAME = 'touhidur';

async function run() {
  // 1. Get first user with connected handles
  const { data: handles, error: hError } = await supabase
    .from('user_handles')
    .select('user_id, platform, handle');
    
  if (hError) {
    console.error('Error fetching handles:', hError);
    return;
  }
  
  if (!handles || handles.length === 0) {
    console.log('No connected handles found in user_handles.');
    return;
  }
  
  const userId = handles[0].user_id;
  console.log('Using User ID:', userId);
  console.log('Connected Handles:', handles);
  
  // Dynamic import of services from the Next.js app
  // Note: Since they use ES Modules, we can use dynamic import()
  const { ClistService } = await import('../app/_lib/services/problem-solving-services/clist.js');
  
  const clistService = new ClistService();
  const handlesList = handles.map(h => ({ platform: h.platform, handle: h.handle }));
  
  console.log('Fetching contest history...');
  const contestHistory = await clistService.getAggregatedContestHistory(handlesList, 2);
  
  console.log(`Fetched ${contestHistory.length} contests:`);
  contestHistory.forEach((c, idx) => {
    console.log(`\n--- Contest ${idx + 1} ---`);
    console.log('Name:', c.name);
    console.log('Platform:', c.platform);
    console.log('Solved:', c.solved);
    console.log('Total Problems:', c.totalProblems);
    console.log('Problems array length:', c.problems ? c.problems.length : 'null');
    if (c.problems) {
      console.log('Problems sample:', c.problems.slice(0, 3));
    }
  });
}

run().catch(console.error);
