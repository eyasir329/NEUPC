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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const platforms = ['codechef.com', 'atcoder.jp'];
  
  for (const platform of platforms) {
    console.log(`\n=================== ${platform} ===================`);
    try {
      const accountData = await fetchClist('account', { resource: platform, handle: 'eyasir329' });
      if (!accountData.objects || accountData.objects.length === 0) continue;
      const accountId = accountData.objects[0].id;
      
      await sleep(6000); // 6s delay
      
      const statsData = await fetchClist('statistics', {
        account_id: accountId,
        order_by: '-date',
        with_problems: true,
        limit: 5
      });
      
      if (!statsData.objects) continue;
      
      for (const s of statsData.objects) {
        const problems = s.problems || s.addition?.problems || {};
        for (const [label, p] of Object.entries(problems)) {
          if (p.result !== undefined) {
            console.log(`Platform: ${platform} | Contest: ${s.contest?.title || s.contest_title} | Problem: ${label}`);
            console.log(`  result: "${p.result}" (type: ${typeof p.result})`);
            console.log(`  verdict: "${p.verdict}" (type: ${typeof p.verdict})`);
            console.log(`  binary: "${p.binary}" (type: ${typeof p.binary})`);
            console.log(`  partial: "${p.partial}" (type: ${typeof p.partial})`);
            console.log(`  upsolving: "${p.upsolving}" (type: ${typeof p.upsolving})`);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    await sleep(6000); // 6s delay
  }
}

run().catch(console.error);
