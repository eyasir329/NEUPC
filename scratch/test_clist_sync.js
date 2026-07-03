const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { ClistService } = require('../app/_lib/services/problem-solving-services/clist');

async function run() {
  const clist = new ClistService();
  console.log('CLIST Service initialized.');
  console.log('Is Configured:', clist.isConfigured());

  const handles = [
    { platform: 'codeforces', handle: 'eyasir329' },
    { platform: 'codechef', handle: 'eyasir329' },
    { platform: 'atcoder', handle: 'eyasir329' },
    { platform: 'leetcode', handle: 'eyasir329' }
  ];

  for (const h of handles) {
    console.log(`\n--- Fetching for ${h.platform} / ${h.handle} ---`);
    try {
      const stats = await clist.getContestStatistics(h.platform, h.handle, 10);
      console.log(`Found ${stats.length} contests for ${h.platform}`);
      if (stats.length > 0) {
        console.log('Sample:', stats[0]);
      }
    } catch (e) {
      console.error(`Error for ${h.platform}:`, e);
    }
  }
}

run().catch(console.error);
