/**
 * @file Use problem solving.mock
 * @module useProblemSolving.mock
 */

const now = Date.now();
const daysAgo = (d) => new Date(now - d * 86400000).toISOString();
const daysAgoDate = (d) =>
  new Date(now - d * 86400000).toISOString().split('T')[0];

const PROBLEMS = [
  {
    name: 'Two Sum',
    difficulty: 'Easy',
    rating: 800,
    tags: ['hash-map', 'array'],
  },
  {
    name: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    rating: 1400,
    tags: ['sliding-window', 'string'],
  },
  {
    name: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    rating: 2100,
    tags: ['binary-search', 'divide-conquer'],
  },
  {
    name: 'Merge K Sorted Lists',
    difficulty: 'Hard',
    rating: 2300,
    tags: ['heap', 'linked-list'],
  },
  { name: 'Climbing Stairs', difficulty: 'Easy', rating: 900, tags: ['dp'] },
  {
    name: 'Coin Change',
    difficulty: 'Medium',
    rating: 1500,
    tags: ['dp', 'bfs'],
  },
  {
    name: 'Word Ladder',
    difficulty: 'Hard',
    rating: 2200,
    tags: ['bfs', 'string'],
  },
  {
    name: 'Number of Islands',
    difficulty: 'Medium',
    rating: 1600,
    tags: ['dfs', 'bfs', 'union-find'],
  },
  {
    name: 'LRU Cache',
    difficulty: 'Medium',
    rating: 1700,
    tags: ['hash-map', 'linked-list', 'design'],
  },
  {
    name: 'Trapping Rain Water',
    difficulty: 'Hard',
    rating: 2400,
    tags: ['two-pointer', 'stack', 'dp'],
  },
  {
    name: 'Valid Parentheses',
    difficulty: 'Easy',
    rating: 850,
    tags: ['stack', 'string'],
  },
  {
    name: 'Maximum Subarray',
    difficulty: 'Medium',
    rating: 1300,
    tags: ['dp', 'divide-conquer'],
  },
  {
    name: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    rating: 1200,
    tags: ['bfs', 'tree'],
  },
  {
    name: 'Course Schedule',
    difficulty: 'Medium',
    rating: 1800,
    tags: ['dfs', 'topological-sort', 'graph'],
  },
  {
    name: 'Edit Distance',
    difficulty: 'Hard',
    rating: 2000,
    tags: ['dp', 'string'],
  },
  {
    name: 'Find Median from Data Stream',
    difficulty: 'Hard',
    rating: 2100,
    tags: ['heap', 'design'],
  },
  {
    name: 'Jump Game II',
    difficulty: 'Medium',
    rating: 1450,
    tags: ['greedy', 'dp'],
  },
  {
    name: 'Reverse Linked List',
    difficulty: 'Easy',
    rating: 800,
    tags: ['linked-list', 'recursion'],
  },
  {
    name: 'Serialize and Deserialize Binary Tree',
    difficulty: 'Hard',
    rating: 2250,
    tags: ['tree', 'design', 'dfs'],
  },
  {
    name: 'Longest Palindromic Subsequence',
    difficulty: 'Medium',
    rating: 1600,
    tags: ['dp', 'string'],
  },
];

const CF_PROBLEMS = [
  {
    name: 'Polycarp and Coins',
    difficulty: 'Easy',
    rating: 800,
    tags: ['math', 'greedy'],
  },
  {
    name: 'Tokitsukaze and Strange Inequality',
    difficulty: 'Hard',
    rating: 2100,
    tags: ['dp', 'combinatorics'],
  },
  {
    name: 'Grid Path',
    difficulty: 'Medium',
    rating: 1500,
    tags: ['dp', 'graphs'],
  },
  {
    name: 'Vasya and String',
    difficulty: 'Medium',
    rating: 1400,
    tags: ['string', 'two-pointer'],
  },
  {
    name: 'Segment Coloring',
    difficulty: 'Easy',
    rating: 1100,
    tags: ['constructive', 'greedy'],
  },
  {
    name: 'XOR Triangle',
    difficulty: 'Hard',
    rating: 2400,
    tags: ['bitmask', 'dp'],
  },
  {
    name: 'Increasing Sequence',
    difficulty: 'Easy',
    rating: 900,
    tags: ['greedy', 'math'],
  },
  {
    name: 'Tree Requests',
    difficulty: 'Hard',
    rating: 2200,
    tags: ['dfs', 'tree', 'offline'],
  },
  {
    name: 'Minimum Spanning Tree',
    difficulty: 'Medium',
    rating: 1600,
    tags: ['graphs', 'dsu'],
  },
  {
    name: 'Palindrome Partition',
    difficulty: 'Hard',
    rating: 1900,
    tags: ['dp', 'string', 'palindrome'],
  },
];

const AC_PROBLEMS = [
  {
    name: 'Traveling Salesman Problem',
    difficulty: 'Hard',
    rating: 2200,
    tags: ['bitmask-dp', 'graph'],
  },
  { name: 'Grid 1', difficulty: 'Easy', rating: 900, tags: ['dp', 'grid'] },
  {
    name: 'Longest Path',
    difficulty: 'Medium',
    rating: 1400,
    tags: ['dp', 'dag'],
  },
  {
    name: 'Knapsack 1',
    difficulty: 'Medium',
    rating: 1300,
    tags: ['dp', 'knapsack'],
  },
  {
    name: 'Independent Set',
    difficulty: 'Hard',
    rating: 2000,
    tags: ['tree-dp', 'tree'],
  },
];

const PLATFORMS = ['leetcode', 'codeforces', 'atcoder'];

const platformProblems = {
  leetcode: PROBLEMS,
  codeforces: CF_PROBLEMS,
  atcoder: AC_PROBLEMS,
};

function makeSub(i) {
  const platform = PLATFORMS[i % 3];
  const pool = platformProblems[platform];
  const prob = pool[i % pool.length];
  const isAC = i % 7 !== 0;
  return {
    id: `sub-${i}`,
    platform,
    problem_id: `${platform}-prob-${i}`,
    problem_name: prob.name,
    verdict: isAC ? 'AC' : ['WA', 'TLE', 'MLE', 'RE'][i % 4],
    difficulty: prob.difficulty,
    difficulty_rating: prob.rating,
    tags: prob.tags,
    submitted_at: daysAgo(Math.floor(i * 0.4)),
  };
}

export const dummyData = {
  statistics: {
    total_solved: 1247,
    total_submissions: 3412,
    weighted_score: 9320.5,
    current_streak: 42,
    longest_streak: 67,
    easy_solved: 412,
    medium_solved: 618,
    hard_solved: 187,
    expert_solved: 30,
    accepted_rate: 76.4,
    global_rank: 42,
    platform_stats: {
      leetcode: { rating: 2187, max_rating: 2245, solved_count: 512 },
      codeforces: { rating: 1963, max_rating: 2012, solved_count: 420 },
      atcoder: { rating: 1810, max_rating: 1810, solved_count: 124 },
      codechef: { rating: 1650, max_rating: 1720, solved_count: 191 },
    },
  },

  handles: [
    {
      platform: 'leetcode',
      handle: 'shadowcoder',
      rating: 2187,
      connected: true,
    },
    {
      platform: 'codeforces',
      handle: 'shadow_cf',
      rating: 1963,
      connected: true,
    },
    {
      platform: 'atcoder',
      handle: 'shadow_ac',
      rating: 1810,
      connected: true,
    },
    {
      platform: 'codechef',
      handle: 'shadow_cc',
      rating: 1650,
      connected: true,
    },
  ],

  recentSubmissions: Array.from({ length: 120 }, (_, i) => makeSub(i)),

  dailyActivity: Array.from({ length: 730 }, (_, i) => {
    const base =
      i < 42
        ? Math.floor(Math.random() * 6) + 1
        : Math.floor(Math.random() * 5);
    return {
      activity_date: daysAgoDate(i),
      problems_solved: i % 11 === 0 ? 0 : base,
    };
  }),

  ratingHistory: [
    ...Array.from({ length: 25 }, (_, i) => ({
      platform: 'codeforces',
      rating: 1600 + i * 18 + (i % 3 === 0 ? -25 : 0),
      date: now - (25 - i) * 14 * 86400000,
      contest: `Codeforces Round ${800 + i}`,
    })),
    ...Array.from({ length: 20 }, (_, i) => ({
      platform: 'leetcode',
      rating: 1750 + i * 29 + (i % 4 === 0 ? -40 : 0),
      date: now - (20 - i) * 14 * 86400000,
      contest: `Weekly Contest ${350 + i}`,
    })),
    ...Array.from({ length: 15 }, (_, i) => ({
      platform: 'atcoder',
      rating: 1600 + i * 21 + (i % 3 === 0 ? -15 : 0),
      date: now - (15 - i) * 21 * 86400000,
      contest: `AtCoder Regular Contest ${150 + i}`,
    })),
  ],

  contestHistory: [
    {
      id: 'c-0',
      platform: 'codeforces',
      name: 'Codeforces Round 819 (Div. 1)',
      ratingChange: +47,
      new_rating: 1963,
      rank: 312,
      total_participants: 8420,
      solved: 3,
      totalProblems: 6,
      date: daysAgo(3),
      problems: [
        { label: 'A', solved: true, verdict: 'AC' },
        { label: 'B', solved: true, verdict: 'AC' },
        { label: 'C', solved: true, verdict: 'AC' },
        { label: 'D', solved: false, verdict: 'WA' },
        { label: 'E', solved: false, verdict: '—' },
      ],
    },
    {
      id: 'c-1',
      platform: 'leetcode',
      name: 'Weekly Contest 398',
      ratingChange: +29,
      new_rating: 2187,
      rank: 88,
      total_participants: 24100,
      solved: 4,
      totalProblems: 4,
      date: daysAgo(7),
      problems: [
        { label: '1', solved: true, verdict: 'AC' },
        { label: '2', solved: true, verdict: 'AC' },
        { label: '3', solved: true, verdict: 'AC' },
        { label: '4', solved: true, verdict: 'AC' },
      ],
    },
    {
      id: 'c-2',
      platform: 'atcoder',
      name: 'AtCoder Regular Contest 158',
      ratingChange: +18,
      new_rating: 1810,
      rank: 254,
      total_participants: 5600,
      solved: 2,
      totalProblems: 6,
      date: daysAgo(14),
      problems: [
        { label: 'A', solved: true, verdict: 'AC' },
        { label: 'B', solved: true, verdict: 'AC' },
        { label: 'C', solved: false, verdict: 'TLE' },
      ],
    },
    {
      id: 'c-3',
      platform: 'codeforces',
      name: 'Codeforces Round 817 (Div. 1)',
      ratingChange: -22,
      new_rating: 1916,
      rank: 891,
      total_participants: 7980,
      solved: 1,
      totalProblems: 6,
      date: daysAgo(17),
      problems: [{ label: 'A', solved: true, verdict: 'AC' }],
    },
    {
      id: 'c-4',
      platform: 'leetcode',
      name: 'Biweekly Contest 129',
      ratingChange: +55,
      new_rating: 2158,
      rank: 44,
      total_participants: 19800,
      solved: 4,
      totalProblems: 4,
      date: daysAgo(21),
    },
    {
      id: 'c-5',
      platform: 'codeforces',
      name: 'Educational Codeforces Round 163',
      ratingChange: +38,
      new_rating: 1938,
      rank: 420,
      total_participants: 11200,
      solved: 4,
      totalProblems: 7,
      date: daysAgo(28),
    },
    {
      id: 'c-6',
      platform: 'atcoder',
      name: 'AtCoder Grand Contest 061',
      ratingChange: -10,
      new_rating: 1792,
      rank: 378,
      total_participants: 4200,
      solved: 1,
      totalProblems: 6,
      date: daysAgo(35),
    },
    {
      id: 'c-7',
      platform: 'leetcode',
      name: 'Weekly Contest 396',
      ratingChange: +22,
      new_rating: 2103,
      rank: 130,
      total_participants: 22700,
      solved: 3,
      totalProblems: 4,
      date: daysAgo(42),
    },
    {
      id: 'c-8',
      platform: 'codechef',
      name: 'CodeChef Starters 119',
      ratingChange: +31,
      new_rating: 1650,
      rank: 201,
      total_participants: 6800,
      solved: 5,
      totalProblems: 6,
      date: daysAgo(49),
    },
    {
      id: 'c-9',
      platform: 'codeforces',
      name: 'Codeforces Round 815 (Div. 2)',
      ratingChange: +64,
      new_rating: 1900,
      rank: 197,
      total_participants: 14300,
      solved: 5,
      totalProblems: 6,
      date: daysAgo(56),
    },
  ],

  badges: [
    {
      id: 'b-1',
      name: '100 Day Streak',
      icon: '🔥',
      earned_at: daysAgo(5),
      rarity: 'epic',
      description:
        'Maintained a problem-solving streak for 100 consecutive days.',
    },
    {
      id: 'b-2',
      name: 'Hard Problem Slayer',
      icon: '⚔️',
      earned_at: daysAgo(12),
      rarity: 'rare',
      description: 'Solved 100+ problems with a difficulty rating over 2000.',
    },
    {
      id: 'b-3',
      name: 'Contest Regular',
      icon: '🏆',
      earned_at: daysAgo(20),
      rarity: 'rare',
      description:
        'Participated in 25+ official contests across all platforms.',
    },
    {
      id: 'b-4',
      name: 'Dynamic Programmer',
      icon: '🧠',
      earned_at: daysAgo(35),
      rarity: 'uncommon',
      description: 'Solved 50+ problems categorized under Dynamic Programming.',
    },
    {
      id: 'b-5',
      name: 'Graph Master',
      icon: '🕸️',
      earned_at: daysAgo(60),
      rarity: 'uncommon',
      description: 'Solved 50+ problems involving graphs, trees, or BFS/DFS.',
    },
    {
      id: 'b-6',
      name: 'First Solve',
      icon: '⭐',
      earned_at: daysAgo(300),
      rarity: 'common',
      description:
        'Successfully solved your very first problem on the platform.',
    },
  ],

  leaderboard: {
    entries: [
      {
        user_id: '1',
        username: 'tourist',
        total_score: 25000,
        total_solved: 3500,
        global_rank: 1,
      },
      {
        user_id: '2',
        username: 'Jiangly',
        total_score: 24500,
        total_solved: 3200,
        global_rank: 2,
      },
      {
        user_id: '3',
        username: 'Emaxx',
        total_score: 23000,
        total_solved: 3100,
        global_rank: 3,
      },
      {
        user_id: '4',
        username: 'Um_nik',
        total_score: 22000,
        total_solved: 2900,
        global_rank: 4,
      },
      {
        user_id: '5',
        username: 'Radewoosh',
        total_score: 21000,
        total_solved: 2800,
        global_rank: 5,
      },
      {
        user_id: '6',
        username: 'Petr',
        total_score: 20500,
        total_solved: 2750,
        global_rank: 6,
      },
      {
        user_id: '7',
        username: 'Benq',
        total_score: 20000,
        total_solved: 2700,
        global_rank: 7,
      },
      {
        user_id: '8',
        username: 'Scott_Wu',
        total_score: 19500,
        total_solved: 2600,
        global_rank: 8,
      },
      {
        user_id: '9',
        username: 'Pajonk',
        total_score: 19000,
        total_solved: 2500,
        global_rank: 9,
      },
      {
        user_id: 'user-123',
        username: 'shadowcoder',
        total_score: 9320,
        total_solved: 1247,
        global_rank: 42,
      },
    ],
  },
};
