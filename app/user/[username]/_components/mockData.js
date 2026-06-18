/**
 * @file Mock profile data for public profile display.
 * Mirrors the developer-profile reference project's initialData.ts
 * Includes generated activity data for the submission heatmap.
 */

/* ─────────────────────────────────────────────────────────────
   Activity map generator — creates realistic-looking heatmap data
   for the past 400 days across multiple platforms.
   ───────────────────────────────────────────────────────────── */
function generateActivity(days = 400, density = 0.55, maxCount = 8) {
  const result = {};
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (Math.random() < density) {
      result[d.toISOString().split('T')[0]] = Math.ceil(Math.random() * maxCount);
    }
  }
  return result;
}

export const MOCK_PROFILE = {
  name: 'Eyasir Ahamed',
  username: 'eyasir329',
  email: 'eyasir329@gmail.com',
  phone: '+880 1712-345678',
  location: 'Netrokona, Bangladesh',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  university: 'University of Netrokona',
  degree: 'Bachelor of Engineering',
  session: '2020-21',
  department: 'Computer Science & Engineering',
  studentId: '202004017',
  cgpa: 3.51,
  semester: 8,
  bio: 'Verified Executive Administrator at NEUPC. Experienced in Competitive Programming and web architectures.',
  careerObjective: 'Aspiring Software Engineer & Active Competitive Programmer with a robust foundation in Data Structures, Algorithms, and Distributed Systems. Dedicated to building highly performant, scalable, and secure backend microservices and full-stack web applications. Seeking opportunities to leverage algorithmic expertise and engineering skills to solve complex real-world problems at scale.',

  socials: {
    github: 'https://github.com/eyasir329',
    linkedin: 'https://linkedin.com/in/eyasir329',
    twitter: '_eyasir329',
    facebook: 'eyasir329',
  },

  skills: ['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL', 'Redis'],
  areasOfInterest: ['competitive-programming', 'ai-ml', 'llm', 'full-stack-web-development', 'distributed-systems', 'cloud-infrastructure'],

  codingProfiles: [
    { platform: 'LeetCode',   handle: 'eyasir329', url: 'https://leetcode.com/eyasir329',                    rating: '2042 Guardian',    solved: 778, color: '#f59e0b' },
    { platform: 'Codeforces', handle: 'eyasir329', url: 'https://codeforces.com/profile/eyasir329',          rating: '1412 Specialist',  solved: 215, color: '#ef4444' },
    { platform: 'CodeChef',   handle: 'eyasir329', url: 'https://www.codechef.com/users/eyasir329',          rating: '3★ 1680',          solved: 140, color: '#d97706' },
    { platform: 'AtCoder',    handle: 'eyasir329', url: 'https://atcoder.jp/users/eyasir329',                rating: '945 Green',        solved: 112, color: '#10b981' },
  ],

  contests: [
    { host: 'LeetCode',   name: 'Weekly Contest 392',       rank: '312 / 22,000',  rating: '+36'  },
    { host: 'Codeforces', name: 'Div. 2 Round 942',         rank: '891 / 14,300',  rating: '+55'  },
    { host: 'LeetCode',   name: 'Biweekly Contest 124',     rank: '184 / 19,500',  rating: '+41'  },
    { host: 'CodeChef',   name: 'Starters 121 (Div. 2)',    rank: '105 / 8,200',   rating: '+82'  },
    { host: 'AtCoder',    name: 'Beginner Contest 342',     rank: '223 / 11,100',  rating: '+48'  },
    { host: 'Codeforces', name: 'Div. 3 Round 912',         rank: '94 / 18,700',   rating: '+122' },
  ],

  projects: [
    { title: 'Interactive DSA Sandbox',     desc: 'Node-graph compiler visualizing pathfinding, sorting algorithms, and heap trees on HTML canvas with step-by-step replay.', url: 'https://github.com/eyasir329/dsa-sandbox',    stars: 112, tags: ['React', 'Canvas', 'TS']       },
    { title: 'Smart-Proxy API Gateway',     desc: 'Ultra-fast caching proxy gateway for REST APIs with auto TLS cert generation, circuit-breakers, and metrics export.',     url: 'https://github.com/eyasir329/smart-proxy',   stars: 84,  tags: ['Node', 'Express', 'Redis']   },
    { title: 'Markdown Canvas Notes',       desc: 'Rich text editor mapping notes in bidirectional links with local IndexedDB sync and offline-first PWA support.',         url: 'https://github.com/eyasir329/markdown-notes', stars: 56,  tags: ['Vite', 'React', 'Storage']  },
    { title: 'Distributed Log Consumator',  desc: 'Fault-tolerant message queue in Go with atomic commit logs, Raft consensus replication, and HTTP/gRPC interfaces.',     url: 'https://github.com/eyasir329/dist-log',      stars: 92,  tags: ['Go', 'Raft', 'Protobuf']    },
  ],

  achievements: [
    { title: 'Academic Excellence Honors Award',          issuer: 'University of Netrokona',    date: '2024-01' },
    { title: 'Champion – Intra-University Programming Contest', issuer: 'NEUPC',               date: '2023-08' },
    { title: 'Dean\'s List Award (First Class Honours)',   issuer: 'University of Netrokona',    date: '2022-09' },
  ],

  certificates: [
    { title: 'Advanced Data Structures & Algorithms',       issuer: 'Coursera (Princeton)',     date: '2023-08' },
    { title: 'Meta Front-End Developer Professional',       issuer: 'Meta',                     date: '2023-11' },
    { title: 'AWS Solutions Architect – Associate',         issuer: 'Amazon Web Services',      date: '2024-02' },
    { title: 'Google Advanced Data Analytics',             issuer: 'Google (Coursera)',          date: '2023-05' },
  ],

  workExperience: [
    {
      role: 'Full-Stack Developer Intern', company: 'TechNovation Labs', type: 'Internship',
      period: 'Dec 2023 — Mar 2024', location: 'Dhaka',
      description: 'Designed modular microservices & interactive analytics dashboards. Built REST APIs using Express.js, integrated PostgreSQL with Prisma ORM, and deployed containerized services on AWS ECS.',
      skills: ['React', 'Node.js', 'Express', 'Prisma', 'AWS'],
    },
    {
      role: 'Backend Engineering Apprentice', company: 'Open-Source Lab Netrokona', type: 'Part-time',
      period: 'Jun — Nov 2023', location: 'Netrokona',
      description: 'Maintained PostgreSQL schemas, automated migrations using Flyway, integrated Google OAuth2 social login, and co-authored internal API documentation.',
      skills: ['PostgreSQL', 'TypeScript', 'Docker', 'OAuth2'],
    },
    {
      role: 'Undergraduate Technical Assistant', company: 'University of Netrokona', type: 'Part-time',
      period: 'Jan 2024 — Present', location: 'Netrokona',
      description: 'Conducted lab demonstrations for DSA, OOP, and OS courses. Built automated Docker sandbox for grading programming assignments securely.',
      skills: ['C++', 'Shell', 'Docker'],
    },
  ],

  education: [
    { level: 'University', institution: 'University of Netrokona',       degree: 'B.Sc. in CSE',    result: 'CGPA: 3.51 / 4.00', period: '2020 — Present' },
    { level: 'College',    institution: 'Netrokona Govt. College',        degree: 'HSC — Science',   result: 'GPA: 5.00',          period: '2018 — 2020'   },
    { level: 'School',     institution: 'Netrokona Govt. High School',    degree: 'SSC — Science',   result: 'GPA: 5.00',          period: '2013 — 2018'   },
  ],

  offlineParticipation: [
    { role: 'Team Captain', event: 'ACM ICPC Dhaka Regional 2023', type: 'ICPC',      rank: '48th / 240',   date: '2023-11', venue: 'UAP, Dhaka'    },
    { role: 'Contestant',   event: 'SUST National IUPC 2024',      type: 'IUPC',      rank: '34th / 180',   date: '2024-03', venue: 'SUST, Sylhet'  },
    { role: 'Runner-up',    event: 'National Hackathon 2023',       type: 'Hackathon', rank: '2nd Place',    date: '2023-12', venue: 'BCC, Dhaka'    },
    { role: 'Team Lead',    event: 'BUET IUPC Contest',             type: 'IUPC',      rank: '52nd / 195',   date: '2023-09', venue: 'BUET, Dhaka'   },
  ],

  research: [
    {
      role: 'Undergraduate Research Assistant', institution: 'University of Netrokona, CSE',
      period: 'Jul 2023 — Present',
      description: 'Novel heuristics for Multi-Objective Vehicle Routing Problem using genetic algorithms with dynamic constraint relaxation.',
    },
    {
      role: 'Research Intern — Computer Vision', institution: 'University of Dhaka',
      period: 'Jan — Jun 2023',
      description: 'Lightweight U-Net CNN architectures for satellite imagery segmentation achieving 94.2% mIoU at 12× reduced parameter count.',
    },
  ],

  publications: [
    { title: 'Optimization Framework for Multi-Objective Vehicle Routing',  journal: 'IEEE ICACC',     date: 'Dec 2024', status: 'Accepted'  },
    { title: 'Lightweight CNN for Real-Time Satellite Image Segmentation',  journal: 'Springer JISA',  date: 'Apr 2024', status: 'Published' },
  ],

  references: [
    { name: 'Dr. Md. Ashraful Islam', designation: 'Professor & Dept. Head', institution: 'CSE, University of Netrokona', email: 'ashraful.cse@un.edu.bd'       },
    { name: 'S. M. Farhan',           designation: 'Software Architect',      institution: 'TechNovation Labs, Dhaka',    email: 'farhan.arch@technovation.com' },
  ],

  extracurriculars: [
    'Executive Committee Member & Admin at NEUPC, organizing coding contests.',
    'Lead Site Volunteer for national collegiate programming contest preparations.',
    'Active Mentor for weekly C++ syntax & logic workshops for freshmen.',
  ],

  hobbies: ['Competitive Programming', 'Technical Blog Writing', 'Acoustic Guitar', 'Philosophy & Non-Fiction', 'Nature Photography'],

  quickStats: { totalSolved: 1245, currentStreak: 14, longestStreak: 47, totalContests: 86 },

  /* Heatmap activity maps — generated on module load */
  activity: {
    leetcode:   generateActivity(400, 0.60, 6),
    codeforces: generateActivity(400, 0.35, 5),
    codechef:   generateActivity(400, 0.25, 4),
    atcoder:    generateActivity(400, 0.20, 3),
    github:     generateActivity(400, 0.70, 8),
    todolist:   generateActivity(400, 0.45, 4),
    courseWatchTime: generateActivity(400, 0.30, 3),
  },
};
