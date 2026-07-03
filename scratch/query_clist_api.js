// Use global fetch available in Node.js >= 18
const CLIST_API_KEY = '044672d74c772b417a18a8a641339c8ccaa29953';
const CLIST_API_USERNAME = 'eyasir329';

async function fetchClist(endpoint, params) {
  const url = new URL(`https://clist.by/api/v2/${endpoint}/`);
  url.searchParams.set('username', CLIST_API_USERNAME);
  url.searchParams.set('api_key', CLIST_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function run() {
  const platforms = ['codeforces.com', 'codechef.com', 'atcoder.jp', 'leetcode.com'];
  
  for (const platform of platforms) {
    console.log(`\n=================== ${platform} ===================`);
    try {
      // 1. Find account first
      const accountData = await fetchClist('account', { resource: platform, handle: 'eyasir329' });
      if (!accountData.objects || accountData.objects.length === 0) {
        console.log(`No CLIST account found for ${platform}`);
        continue;
      }
      const accountId = accountData.objects[0].id;
      console.log(`Account ID for ${platform}:`, accountId);
      
      // 2. Fetch statistics
      const statsData = await fetchClist('statistics', {
        account_id: accountId,
        order_by: '-date',
        with_problems: true,
        limit: 3
      });
      
      if (!statsData.objects || statsData.objects.length === 0) {
        console.log(`No statistics objects found for ${platform}`);
        continue;
      }
      
      console.log(`Fetched ${statsData.objects.length} contests:`);
      statsData.objects.forEach((s, idx) => {
        console.log(`\nContest ${idx+1}:`, s.contest?.title || s.contest_title);
        console.log(`Place/Rank:`, s.place);
        console.log(`Solving:`, s.solving);
        console.log(`Solved (stat.solved):`, s.solved);
        console.log(`Addition Solving:`, s.addition?.solving);
        console.log(`Addition Solved:`, s.addition?.solved);
        
        const problems = s.problems || s.addition?.problems || {};
        console.log(`Problems Keys:`, Object.keys(problems));
        console.log(`Problems Sample (first 2):`, Object.entries(problems).slice(0, 2).map(([k, v]) => ({
          label: k,
          result: v.result,
          binary: v.binary,
          time: v.time,
          status: v.status,
          upsolve: v.upsolve
        })));
      });
      
    } catch (err) {
      console.error(`Error for ${platform}:`, err.message);
    }
  }
}

run().catch(console.error);
