'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function RoadmapDetailPage() {
  const params = useParams();
  const roadmapId = params.roadmapId;

  const [activeStage, setActiveStage] = useState(0);
  const [completedTopics, setCompletedTopics] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTopic = (topicId) => {
    setCompletedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  // Roadmap database
  const roadmapsData = {
    'competitive-programming': {
      id: 1,
      title: 'Competitive Programming',
      icon: '🧠',
      level: 'Beginner to Advanced',
      duration: '6-12 months',
      gradient: 'from-blue-500/20 to-purple-500/20',
      borderColor: 'border-blue-500/30',
      description:
        'Master algorithms and problem-solving to compete in ICPC and beyond. This comprehensive roadmap will take you from basics to advanced competitive programming techniques.',
      prerequisites: [
        'Basic programming knowledge',
        'Mathematical thinking',
        'Problem-solving interest',
      ],
      outcomes: [
        'ICPC Regional qualification',
        '1700+ Codeforces rating',
        'Strong algorithmic foundation',
      ],
      stages: [
        {
          title: 'Foundation',
          duration: '2-3 months',
          description:
            'Build a strong foundation in C++ and basic problem-solving',
          topics: [
            {
              id: 1,
              name: 'C++ Basics',
              resources: ['CPP Reference', 'Learn CPP'],
              hours: 40,
            },
            {
              id: 2,
              name: 'STL (Vector, Map, Set)',
              resources: ['STL Tutorial', 'Competitive Programming STL'],
              hours: 30,
            },
            {
              id: 3,
              name: 'Time Complexity Analysis',
              resources: ['Big O Notation', 'Algorithm Analysis'],
              hours: 20,
            },
            {
              id: 4,
              name: 'Basic Problem Solving',
              resources: ['Codeforces Div3', 'AtCoder Beginner'],
              hours: 60,
            },
          ],
          goal: 'Solve Codeforces Div3 problems consistently',
          projects: [
            'Solve 100 basic problems',
            'Implement all STL containers',
          ],
        },
        {
          title: 'Intermediate',
          duration: '3-4 months',
          description: 'Learn intermediate algorithms and data structures',
          topics: [
            {
              id: 5,
              name: 'Recursion & Backtracking',
              resources: ['Recursion Guide', 'LeetCode Recursion'],
              hours: 35,
            },
            {
              id: 6,
              name: 'Binary Search & Two Pointers',
              resources: ['Binary Search Tutorial', 'Two Pointers Technique'],
              hours: 25,
            },
            {
              id: 7,
              name: 'Greedy Algorithms',
              resources: ['Greedy Approach', 'Greedy Problems'],
              hours: 30,
            },
            {
              id: 8,
              name: 'Graph Basics (DFS, BFS)',
              resources: ['Graph Theory', 'CP Algorithms'],
              hours: 45,
            },
            {
              id: 9,
              name: 'Prefix Sum & Sliding Window',
              resources: ['Prefix Sum Tutorial', 'Sliding Window'],
              hours: 25,
            },
          ],
          goal: 'Solve Codeforces Div2 C-level problems',
          projects: [
            'Solve 150 intermediate problems',
            'Participate in 10 contests',
          ],
        },
        {
          title: 'Advanced',
          duration: '4-5 months',
          description: 'Master advanced algorithms for competitive programming',
          topics: [
            {
              id: 10,
              name: 'Dynamic Programming',
              resources: ['DP Patterns', 'AtCoder DP Contest'],
              hours: 60,
            },
            {
              id: 11,
              name: 'Advanced Graph Algorithms',
              resources: ['Shortest Paths', 'MST, Network Flow'],
              hours: 50,
            },
            {
              id: 12,
              name: 'Number Theory',
              resources: ['Prime Numbers', 'Modular Arithmetic'],
              hours: 40,
            },
            {
              id: 13,
              name: 'Segment Tree & BIT',
              resources: ['Range Queries', 'Advanced DS'],
              hours: 45,
            },
            {
              id: 14,
              name: 'String Algorithms',
              resources: ['KMP', 'Trie, Suffix Array'],
              hours: 35,
            },
          ],
          goal: 'ICPC Regional qualification, 1700+ CF Rating',
          projects: ['ICPC practice', 'Solve 200+ advanced problems'],
        },
      ],
      resources: [
        { name: 'Codeforces', url: '#', type: 'Practice Platform', icon: '💻' },
        {
          name: 'CP Algorithms',
          url: '#',
          type: 'Learning Resource',
          icon: '📚',
        },
        { name: 'AtCoder', url: '#', type: 'Contest Platform', icon: '🏆' },
        {
          name: 'USACO Guide',
          url: '#',
          type: 'Structured Learning',
          icon: '🎓',
        },
      ],
      mentors: [
        { name: 'Md. Arif Rahman', role: 'CF Expert (1800+)', avatar: 'AR' },
        { name: 'Sabbir Ahmed', role: 'ICPC Regionalist', avatar: 'SA' },
      ],
    },
    'web-development': {
      id: 2,
      title: 'Web Development',
      icon: '💻',
      level: 'Beginner to Professional',
      duration: '4-8 months',
      gradient: 'from-green-500/20 to-teal-500/20',
      borderColor: 'border-green-500/30',
      description:
        'Build modern full-stack web applications from scratch to deployment. Learn industry-standard technologies and best practices.',
      prerequisites: [
        'Basic computer skills',
        'Willingness to learn',
        'Time commitment',
      ],
      outcomes: [
        'Build full-stack applications',
        'Deploy to production',
        'Portfolio projects',
      ],
      stages: [
        {
          title: 'Frontend Basics',
          duration: '1-2 months',
          description: 'Master the fundamentals of web development',
          topics: [
            {
              id: 15,
              name: 'HTML5 Semantics',
              resources: ['MDN HTML', 'HTML Tutorial'],
              hours: 25,
            },
            {
              id: 16,
              name: 'CSS3 & Flexbox/Grid',
              resources: ['CSS Tricks', 'Flexbox Guide'],
              hours: 35,
            },
            {
              id: 17,
              name: 'Tailwind CSS',
              resources: ['Tailwind Docs', 'Tailwind Course'],
              hours: 20,
            },
            {
              id: 18,
              name: 'JavaScript ES6+',
              resources: ['JavaScript.info', 'ES6 Features'],
              hours: 50,
            },
          ],
          goal: 'Build responsive landing pages',
          projects: ['Portfolio website', '3 landing pages'],
        },
        {
          title: 'Modern Frontend',
          duration: '2-3 months',
          description: 'Learn modern JavaScript frameworks and tools',
          topics: [
            {
              id: 19,
              name: 'React Fundamentals',
              resources: ['React Docs', 'React Course'],
              hours: 45,
            },
            {
              id: 20,
              name: 'Next.js Framework',
              resources: ['Next.js Docs', 'Next.js Tutorial'],
              hours: 40,
            },
            {
              id: 21,
              name: 'State Management',
              resources: ['Redux', 'Context API'],
              hours: 30,
            },
            {
              id: 22,
              name: 'API Integration',
              resources: ['REST APIs', 'Fetch/Axios'],
              hours: 25,
            },
          ],
          goal: 'Create dynamic web applications',
          projects: ['E-commerce frontend', 'Dashboard app'],
        },
        {
          title: 'Backend & Deployment',
          duration: '2-3 months',
          description: 'Build server-side applications and deploy',
          topics: [
            {
              id: 23,
              name: 'Node.js & Express',
              resources: ['Node.js Guide', 'Express Tutorial'],
              hours: 40,
            },
            {
              id: 24,
              name: 'MongoDB & Mongoose',
              resources: ['MongoDB Docs', 'Database Design'],
              hours: 35,
            },
            {
              id: 25,
              name: 'Authentication & Security',
              resources: ['JWT', 'OAuth'],
              hours: 30,
            },
            {
              id: 26,
              name: 'Deployment (Vercel/VPS)',
              resources: ['Vercel Docs', 'VPS Setup'],
              hours: 25,
            },
          ],
          goal: 'Full-stack project deployment',
          projects: ['Full-stack blog', 'Social media clone'],
        },
      ],
      resources: [
        { name: 'MDN Web Docs', url: '#', type: 'Documentation', icon: '📖' },
        { name: 'Frontend Mentor', url: '#', type: 'Practice', icon: '💪' },
        { name: 'Next.js Docs', url: '#', type: 'Framework', icon: '⚡' },
        { name: 'Vercel', url: '#', type: 'Deployment', icon: '🚀' },
      ],
      mentors: [
        { name: 'Tasnim Akter', role: 'Full-stack Developer', avatar: 'TA' },
        { name: 'Fahim Hassan', role: 'Frontend Expert', avatar: 'FH' },
      ],
    },
    'ai-machine-learning': {
      id: 3,
      title: 'AI & Machine Learning',
      icon: '🤖',
      level: 'Intermediate to Advanced',
      duration: '8-12 months',
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
      description:
        'Dive into artificial intelligence and machine learning. Build intelligent systems and work with cutting-edge AI technologies.',
      prerequisites: [
        'Python programming',
        'Basic mathematics',
        'Statistics knowledge',
      ],
      outcomes: [
        'Build ML models',
        'Deep learning expertise',
        'Kaggle competitions',
      ],
      stages: [
        {
          title: 'Math & Python',
          duration: '2-3 months',
          description: 'Build mathematical and programming foundation',
          topics: [
            {
              id: 27,
              name: 'Python for Data Science',
              resources: ['Python Course', 'Notebooks'],
              hours: 40,
            },
            {
              id: 28,
              name: 'NumPy & Pandas',
              resources: ['NumPy Tutorial', 'Pandas Guide'],
              hours: 35,
            },
            {
              id: 29,
              name: 'Linear Algebra Basics',
              resources: ['Khan Academy', '3Blue1Brown'],
              hours: 30,
            },
            {
              id: 30,
              name: 'Statistics & Probability',
              resources: ['StatQuest', 'Stats Course'],
              hours: 35,
            },
          ],
          goal: 'Data manipulation proficiency',
          projects: ['Data analysis projects', 'Visualization dashboards'],
        },
        {
          title: 'ML Fundamentals',
          duration: '3-4 months',
          description: 'Master classical machine learning algorithms',
          topics: [
            {
              id: 31,
              name: 'Regression Algorithms',
              resources: ['Linear Regression', 'ML Course'],
              hours: 30,
            },
            {
              id: 32,
              name: 'Classification Models',
              resources: ['Logistic Regression', 'Decision Trees'],
              hours: 35,
            },
            {
              id: 33,
              name: 'Scikit-learn Library',
              resources: ['sklearn Docs', 'ML Pipeline'],
              hours: 40,
            },
            {
              id: 34,
              name: 'Model Evaluation',
              resources: ['Cross-validation', 'Metrics'],
              hours: 25,
            },
          ],
          goal: 'Build and evaluate ML models',
          projects: ['Prediction models', 'Classification systems'],
        },
        {
          title: 'Deep Learning',
          duration: '3-5 months',
          description: 'Advanced AI with neural networks',
          topics: [
            {
              id: 35,
              name: 'TensorFlow/PyTorch',
              resources: ['TF Tutorial', 'PyTorch Course'],
              hours: 50,
            },
            {
              id: 36,
              name: 'Neural Networks & CNN',
              resources: ['Deep Learning', 'CNN Guide'],
              hours: 45,
            },
            {
              id: 37,
              name: 'NLP Basics',
              resources: ['NLP Course', 'Transformers'],
              hours: 40,
            },
            {
              id: 38,
              name: 'Kaggle Projects',
              resources: ['Kaggle Learn', 'Competitions'],
              hours: 60,
            },
          ],
          goal: 'Advanced AI applications',
          projects: ['Image classification', 'NLP models'],
        },
      ],
      resources: [
        { name: 'Kaggle', url: '#', type: 'Practice & Compete', icon: '🏅' },
        { name: 'Fast.ai', url: '#', type: 'Courses', icon: '🎓' },
        { name: 'Papers with Code', url: '#', type: 'Research', icon: '📄' },
        { name: 'TensorFlow', url: '#', type: 'Framework', icon: '🔧' },
      ],
      mentors: [
        { name: 'Nusrat Jahan', role: 'ML Engineer', avatar: 'NJ' },
        { name: 'Dr. Rahman', role: 'AI Researcher', avatar: 'DR' },
      ],
    },
  };

  // Get current roadmap or default to competitive programming
  const currentRoadmap =
    roadmapsData[roadmapId] || roadmapsData['competitive-programming'];

  // Calculate progress
  const totalTopics = currentRoadmap.stages.reduce(
    (acc, stage) => acc + stage.topics.length,
    0
  );
  const progress =
    totalTopics > 0 ? (completedTopics.length / totalTopics) * 100 : 0;

  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8 lg:py-28">
        {/* Animated Decorative Elements */}
        <div className="from-primary-500/10 fixed top-20 right-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"></div>
        <div
          className="from-secondary-500/10 fixed bottom-20 left-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"
          style={{ animationDelay: '1s' }}
        ></div>

        <div className="relative mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav className="mb-6 md:mb-8" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-gray-400 sm:text-sm">
              <li>
                <Link
                  href="/"
                  className="underline-offset-4 transition-all duration-200 hover:text-white hover:underline"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <svg
                  className="h-4 w-4 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <Link
                  href="/roadmaps"
                  className="underline-offset-4 transition-all duration-200 hover:text-white hover:underline"
                >
                  Roadmaps
                </Link>
              </li>
              <li aria-hidden="true">
                <svg
                  className="h-4 w-4 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li className="font-medium text-white" aria-current="page">
                {currentRoadmap.title}
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Left: Main Info */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6 md:mb-8">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 sm:h-20 sm:w-20 ${currentRoadmap.borderColor} bg-linear-to-br ${currentRoadmap.gradient} text-4xl shadow-lg backdrop-blur-xl transition-transform duration-300 hover:scale-105 sm:text-5xl`}
                >
                  {currentRoadmap.icon}
                </div>
                <div className="flex-1">
                  <h1 className="from-primary-300 to-secondary-300 mb-2 bg-linear-to-r via-white bg-clip-text text-2xl leading-tight font-extrabold text-transparent sm:text-3xl md:text-4xl lg:text-5xl">
                    {currentRoadmap.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-300 backdrop-blur-sm sm:text-sm">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {currentRoadmap.level}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mb-6 text-sm leading-relaxed text-gray-300 sm:text-base md:mb-8 lg:text-lg">
                {currentRoadmap.description}
              </p>

              {/* Key Info */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-lg sm:p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs text-gray-400 sm:text-sm">
                    <svg
                      className="text-primary-400 h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">Duration</span>
                  </div>
                  <div className="group-hover:text-primary-300 text-lg font-bold text-white transition-colors sm:text-xl lg:text-2xl">
                    {currentRoadmap.duration}
                  </div>
                </div>
                <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-lg sm:p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs text-gray-400 sm:text-sm">
                    <svg
                      className="text-secondary-400 h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">Learning Stages</span>
                  </div>
                  <div className="group-hover:text-secondary-300 text-lg font-bold text-white transition-colors sm:text-xl lg:text-2xl">
                    {currentRoadmap.stages.length} Levels
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Progress Card */}
            <div className="lg:col-span-1">
              <div className="hover:shadow-primary-500/10 sticky top-4 rounded-2xl border border-white/10 bg-white/5 bg-linear-to-br from-white/5 to-transparent p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 sm:p-6 lg:top-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white sm:text-lg">
                    Your Progress
                  </h3>
                  <span className="text-xs font-medium text-gray-500">
                    Track your journey
                  </span>
                </div>

                {/* Progress Circle */}
                <div className="mb-6 flex items-center justify-center py-4">
                  <div className="relative">
                    {/* Glow effect */}
                    <div className="bg-primary-500/20 absolute inset-0 rounded-full blur-2xl"></div>
                    <svg className="relative h-32 w-32 -rotate-90 transform drop-shadow-xl sm:h-36 sm:w-36">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-white/10"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#progressGradient)"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                        className="transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient
                          id="progressGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            className="text-primary-400"
                            stopColor="currentColor"
                          />
                          <stop
                            offset="100%"
                            className="text-secondary-400"
                            stopColor="currentColor"
                          />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="from-primary-300 to-secondary-300 bg-linear-to-br bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                        {Math.round(progress)}%
                      </span>
                      <span className="mt-1 text-[10px] font-medium text-gray-500 sm:text-xs">
                        Complete
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-black/20 p-3 text-xs transition-colors hover:bg-black/30 sm:text-sm">
                    <span className="flex items-center gap-2 text-gray-400">
                      <svg
                        className="h-4 w-4 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Completed Topics
                    </span>
                    <span className="font-bold text-white tabular-nums">
                      {completedTopics.length}
                      <span className="text-gray-500">/{totalTopics}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/20 p-3 text-xs transition-colors hover:bg-black/30 sm:text-sm">
                    <span className="flex items-center gap-2 text-gray-400">
                      <svg
                        className="h-4 w-4 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Current Stage
                    </span>
                    <span className="font-bold text-white tabular-nums">
                      {activeStage + 1}
                      <span className="text-gray-500">
                        /{currentRoadmap.stages.length}
                      </span>
                    </span>
                  </div>
                </div>

                <button className="group border-primary-500/50 from-primary-500/30 to-secondary-500/30 hover:border-primary-500/70 hover:shadow-primary-500/20 relative w-full overflow-hidden rounded-xl border bg-linear-to-r py-3 font-bold text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg sm:py-3.5">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span>Start Learning</span>
                    <svg
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                  <div className="from-primary-500/0 via-primary-500/20 to-primary-500/0 absolute inset-0 -translate-x-full bg-linear-to-r transition-transform duration-1000 group-hover:translate-x-full"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prerequisites & Outcomes */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            {/* Prerequisites */}
            <div className="group rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-5 backdrop-blur-xl transition-all duration-300 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5 sm:p-6 lg:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/20 text-xl ring-2 ring-yellow-500/20 transition-all duration-300 group-hover:scale-110 group-hover:ring-yellow-500/40 sm:h-12 sm:w-12 sm:text-2xl">
                  📋
                </div>
                <h3 className="text-lg font-bold text-white sm:text-xl">
                  Prerequisites
                </h3>
              </div>
              <ul className="space-y-3">
                {currentRoadmap.prerequisites.map((req, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/5"
                  >
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm leading-relaxed text-gray-300 sm:text-base">
                      {req}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Outcomes */}
            <div className="group rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-5 backdrop-blur-xl transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 sm:p-6 lg:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/20 text-xl ring-2 ring-green-500/20 transition-all duration-300 group-hover:scale-110 group-hover:ring-green-500/40 sm:h-12 sm:w-12 sm:text-2xl">
                  🎯
                </div>
                <h3 className="text-lg font-bold text-white sm:text-xl">
                  Learning Outcomes
                </h3>
              </div>
              <ul className="space-y-3">
                {currentRoadmap.outcomes.map((outcome, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/5"
                  >
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm leading-relaxed text-gray-300 sm:text-base">
                      {outcome}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center md:mb-10 lg:mb-12">
            <div className="bg-primary-500/10 text-primary-300 ring-primary-500/20 mb-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 sm:text-sm">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Interactive Learning Journey
            </div>
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
              Learning Path
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base md:text-lg">
              Follow this structured path to master{' '}
              {currentRoadmap.title.toLowerCase()}
            </p>
          </div>

          {/* Stage Navigation */}
          <div className="mb-6 flex justify-center sm:mb-8">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 shadow-lg backdrop-blur-xl sm:gap-3 sm:p-2">
              {currentRoadmap.stages.map((stage, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStage(idx)}
                  className={`relative rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 sm:px-6 sm:py-2.5 sm:text-sm ${
                    activeStage === idx
                      ? 'from-primary-500/40 to-secondary-500/40 scale-105 bg-linear-to-r text-white shadow-lg'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{stage.title}</span>
                  {activeStage === idx && (
                    <div className="bg-primary-500/20 absolute inset-0 rounded-full blur-md"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Stage Content */}
          <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/5 to-transparent p-5 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                  {currentRoadmap.stages[activeStage].title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-400 sm:text-base">
                  {currentRoadmap.stages[activeStage].description}
                </p>
                <div className="flex flex-wrap gap-3 text-xs sm:gap-4 sm:text-sm">
                  <div className="bg-primary-500/10 flex items-center gap-2 rounded-lg px-3 py-1.5">
                    <svg
                      className="text-primary-400 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium text-gray-300">
                      {currentRoadmap.stages[activeStage].duration}
                    </span>
                  </div>
                  <div className="bg-secondary-500/10 flex items-center gap-2 rounded-lg px-3 py-1.5">
                    <svg
                      className="text-secondary-400 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span className="font-medium text-gray-300">
                      {currentRoadmap.stages[activeStage].topics.length} Topics
                    </span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 rounded-xl bg-green-500/20 px-4 py-2.5 text-center ring-2 ring-green-500/20 transition-all duration-300 hover:bg-green-500/30 hover:ring-green-500/40 sm:px-5 sm:py-3">
                <div className="mb-0.5 text-[10px] font-medium tracking-wider text-green-400 uppercase sm:text-xs">
                  Goal
                </div>
                <div className="text-xs font-bold text-green-200 sm:text-sm">
                  {currentRoadmap.stages[activeStage].goal}
                </div>
              </div>
            </div>

            {/* Topics List */}
            <div className="space-y-3 sm:space-y-4">
              {currentRoadmap.stages[activeStage].topics.map((topic) => (
                <div
                  key={topic.id}
                  className={`group relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 sm:p-5 ${
                    completedTopics.includes(topic.id)
                      ? 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/5'
                      : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200 sm:mt-1 ${
                        completedTopics.includes(topic.id)
                          ? 'scale-110 border-green-500 bg-green-500 shadow-lg shadow-green-500/50'
                          : 'border-white/30 hover:scale-105 hover:border-white/50 hover:bg-white/5'
                      }`}
                      aria-label={
                        completedTopics.includes(topic.id)
                          ? 'Mark as incomplete'
                          : 'Mark as complete'
                      }
                    >
                      {completedTopics.includes(topic.id) && (
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <h4
                          className={`text-base font-semibold transition-all sm:text-lg ${
                            completedTopics.includes(topic.id)
                              ? 'text-green-300 line-through opacity-75'
                              : 'text-white'
                          }`}
                        >
                          {topic.name}
                        </h4>
                        <span className="bg-primary-500/20 text-primary-300 ring-primary-500/30 rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ring-1 sm:text-xs">
                          ~{topic.hours}h
                        </span>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2">
                        {topic.resources.map((resource, idx) => (
                          <span
                            key={idx}
                            className="group/tag inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-gray-400 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white hover:ring-white/20"
                          >
                            <svg
                              className="h-3 w-3 transition-transform group-hover/tag:scale-110"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                            {resource}
                          </span>
                        ))}
                      </div>

                      {/* Progress bar for this topic */}
                      <div className="relative overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ease-out ${
                            completedTopics.includes(topic.id)
                              ? 'w-full bg-linear-to-r from-green-400 to-green-500'
                              : 'bg-primary-500 w-0 group-hover:w-1/4'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Shimmer effect on hover */}
                  {!completedTopics.includes(topic.id) && (
                    <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="mt-6 rounded-xl border border-yellow-500/30 bg-linear-to-br from-yellow-500/10 to-yellow-500/5 p-4 ring-1 ring-yellow-500/20 backdrop-blur-sm transition-all hover:ring-yellow-500/40 sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-yellow-300 sm:text-sm">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span className="tracking-wide uppercase">
                  Recommended Projects
                </span>
              </div>
              <div className="space-y-2">
                {currentRoadmap.stages[activeStage].projects.map(
                  (project, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-sm text-yellow-200 sm:text-base"
                    >
                      <span className="mt-1 text-yellow-400">•</span>
                      <span>{project}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources & Mentors */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
            {/* Resources */}
            <div>
              <h3 className="mb-5 text-xl font-bold text-white sm:mb-6 sm:text-2xl lg:text-3xl">
                Learning Resources
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {currentRoadmap.resources.map((resource, idx) => (
                  <a
                    key={idx}
                    href={resource.url}
                    className="group hover:border-primary-500/30 hover:shadow-primary-500/10 flex items-center gap-3 rounded-xl border border-white/10 bg-linear-to-r from-white/5 to-transparent p-4 backdrop-blur-xl transition-all hover:scale-[1.02] hover:bg-white/10 hover:shadow-lg sm:gap-4 sm:p-5"
                  >
                    <div className="bg-primary-500/20 ring-primary-500/20 group-hover:ring-primary-500/40 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ring-2 transition-all duration-300 group-hover:scale-110 sm:h-14 sm:w-14 sm:text-2xl">
                      {resource.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="group-hover:text-primary-300 text-sm font-bold text-white transition-colors sm:text-base">
                        {resource.name}
                      </div>
                      <div className="text-xs text-gray-400 sm:text-sm">
                        {resource.type}
                      </div>
                    </div>
                    <svg
                      className="group-hover:text-primary-400 h-5 w-5 text-gray-600 transition-all group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Mentors */}
            <div>
              <h3 className="mb-5 text-xl font-bold text-white sm:mb-6 sm:text-2xl lg:text-3xl">
                Expert Mentors
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {currentRoadmap.mentors.map((mentor, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-linear-to-r from-white/5 to-transparent p-4 backdrop-blur-xl transition-all hover:scale-[1.02] hover:border-white/20 hover:shadow-lg sm:gap-4 sm:p-5"
                  >
                    <div className="from-primary-500/30 to-secondary-500/30 group-hover:ring-primary-500/30 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-lg font-bold text-white ring-2 ring-white/10 transition-all group-hover:ring-4 sm:h-16 sm:w-16 sm:text-xl">
                      {mentor.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white sm:text-base">
                        {mentor.name}
                      </div>
                      <div className="text-xs text-gray-400 sm:text-sm">
                        {mentor.role}
                      </div>
                    </div>
                    <button className="border-primary-500/30 bg-primary-500/10 text-primary-300 hover:bg-primary-500/20 hover:border-primary-500/50 hover:shadow-primary-500/20 rounded-lg border px-4 py-2 text-xs font-bold transition-all hover:scale-105 hover:shadow-lg sm:text-sm">
                      Connect
                    </button>
                  </div>
                ))}
              </div>

              {/* Community CTA */}
              <div className="mt-5 rounded-xl border border-purple-500/30 bg-linear-to-br from-purple-500/10 to-purple-500/5 p-5 ring-1 ring-purple-500/20 backdrop-blur-xl transition-all hover:shadow-lg hover:shadow-purple-500/10 hover:ring-purple-500/40 sm:mt-6 sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-base font-bold text-white sm:text-lg">
                  <svg
                    className="h-5 w-5 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Join Study Groups
                </div>
                <p className="mb-4 text-xs leading-relaxed text-gray-300 sm:text-sm">
                  Connect with fellow learners, share progress, and get help
                  from the community.
                </p>
                <button className="group w-full rounded-lg border border-purple-500/50 bg-purple-500/20 py-2.5 text-sm font-bold text-purple-200 transition-all hover:scale-[1.02] hover:border-purple-500/70 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20 sm:py-3 sm:text-base">
                  <span className="flex items-center justify-center gap-2">
                    Join Community
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-8 sm:px-6 sm:py-12 md:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="border-primary-500/30 from-primary-500/20 via-secondary-500/10 to-primary-500/20 relative overflow-hidden rounded-3xl border bg-linear-to-br p-6 text-center shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
            <div className="bg-primary-500/20 absolute -top-20 -right-20 h-40 w-40 animate-pulse rounded-full blur-3xl"></div>
            <div
              className="bg-secondary-500/20 absolute -bottom-20 -left-20 h-40 w-40 animate-pulse rounded-full blur-3xl"
              style={{ animationDelay: '1s' }}
            ></div>

            <div className="relative">
              <div className="text-primary-300 mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold sm:text-sm">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Start Your Journey Today
              </div>
              <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">
                Ready to Get Started?
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-300 sm:mb-8 sm:text-base lg:text-lg">
                Join thousands of students mastering{' '}
                {currentRoadmap.title.toLowerCase()} with expert guidance
              </p>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <button className="group border-primary-500/50 from-primary-500/40 to-secondary-500/40 hover:shadow-primary-500/50 hover:border-primary-500/70 inline-flex w-full items-center justify-center gap-2 rounded-full border bg-linear-to-r px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition-all hover:scale-105 sm:w-auto sm:px-8 sm:py-4 sm:text-base">
                  <span>Start This Roadmap</span>
                  <svg
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
                <Link
                  href="/roadmaps"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                >
                  <span>Explore Other Roadmaps</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="group fixed right-4 bottom-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-xl transition-all hover:scale-110 hover:border-white/30 hover:bg-white/20 active:scale-95 sm:right-6 sm:bottom-6 sm:h-12 sm:w-12 lg:right-8 lg:bottom-8"
          aria-label="Scroll to top"
        >
          <svg
            className="h-5 w-5 transition-transform group-hover:-translate-y-1 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </main>
  );
}
