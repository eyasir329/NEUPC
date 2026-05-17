'use client';
import { Sparkles, Code2, Lightbulb, Zap, ShieldCheck, Send, Bot, User, Users, ChevronDown, ChevronUp } from 'lucide-react';
import Markdown from 'react-markdown';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const INSIGHTS = {
  overview:
    'Your solution correctly implements the Two Sum logic using a hash map, resulting in an optimal time complexity of **O(N)**. This is considered the best possible approach for an unsorted array.',
  problemAnalysis: `**How this problem can be solved:**

The "Two Sum" problem asks us to find two indices whose elements sum to a target.

1. **Brute Force** — Check every possible pair using nested loops. $O(N^2)$ time, $O(1)$ space.
2. **Sorting + Two Pointers** — Sort with original indices preserved, use left/right pointers. $O(N \\log N)$ time, $O(N)$ space.
3. **Hash Map** — Iterate once, storing complements. $O(N)$ time, $O(N)$ space. ✓ Optimal`,
  myApproach: `**Your Solution Analysis:**

You used the **Hash Map** approach. By storing values and their indices as you iterate, each complement lookup is $O(1)$.

\`\`\`cpp
for (int i = 0; i < n; i++) {
    int complement = target - nums[i];
    if (numMap.count(complement)) return {numMap[complement], i};
    numMap[nums[i]] = i;
}
\`\`\`
This is the most efficient and readable pattern for this problem.`,
  otherApproaches: `**Trade-offs & Alternatives:**
- If the array were **already sorted** (like Two Sum II), **Two Pointers** would be strictly better — $O(1)$ extra space.
- **Brute Force** is trivial to implement but fails at scale ($N = 10^5$ means $10^{10}$ operations).`,
  bestApproach: `**Why Hash Map is best here:**

The input array is **unsorted** and we must return the **original indices**. A Hash Map achieves $O(N)$ time while preserving indices naturally. Any sorting approach adds $O(N \\log N)$ overhead and requires extra bookkeeping to track original positions.`,
  uniqueApproaches: [
    {
      username: 'sarah_coder',
      source: 'Club Member',
      title: 'Two Pointers (Sorted)',
      analysis:
        'Sarah sorted the array first, trading an extra $O(N \\log N)$ step for $O(1)$ auxiliary space. A great variant when memory is constrained, though extra care is needed to map back to original indices.',
      code: `class Solution:
    def twoSum(self, nums, target):
        sorted_nums = sorted(enumerate(nums), key=lambda x: x[1])
        left, right = 0, len(nums) - 1
        while left < right:
            s = sorted_nums[left][1] + sorted_nums[right][1]
            if s == target:
                return [sorted_nums[left][0], sorted_nums[right][0]]
            elif s < target: left += 1
            else: right -= 1
        return []`,
    },
    {
      username: 'tourist',
      source: 'Top 10 Global',
      title: 'Pre-allocated Hash Map',
      analysis:
        'Tourist called `.reserve()` before the loop to minimize dynamic memory reallocation during map insertions — squeezing out maximum constant-factor performance in C++.',
      code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int> m;
        m.reserve(nums.size());
        for (int i = 0; i < (int)nums.size(); ++i) {
            if (m.count(target - nums[i]))
                return {m[target - nums[i]], i};
            m[nums[i]] = i;
        }
        return {};
    }
};`,
    },
  ],
  complexities: { time: 'O(N)', space: 'O(N)' },
};

const SECTION_META = [
  { key: 'problemAnalysis', icon: Lightbulb, label: 'Solution Blueprint',   accent: 'text-amber-400',   border: 'border-amber-500/20',   bg: 'bg-amber-500/5' },
  { key: 'myApproach',      icon: ShieldCheck, label: 'Your Implementation', accent: 'text-violet-400', border: 'border-violet-500/20', bg: 'bg-violet-500/5' },
  { key: 'otherApproaches', icon: Users,     label: 'Alternatives',          accent: 'text-zinc-400',   border: 'border-white/[0.07]',  bg: 'bg-zinc-900/50' },
  { key: 'bestApproach',    icon: Zap,       label: 'Best Approach',         accent: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function AIAnalysisTab() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I've analyzed this problem and your solution. Ask me anything — about the approach, complexity, edge cases, or how to improve.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [expandedApproach, setExpandedApproach] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    const userMsg = prompt.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setPrompt('');
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Great question! Since the array size can be up to $10^4$, an $O(N^2)$ brute-force would yield $10^8$ operations — likely a TLE. That's exactly why the $O(N)$ hash map approach you chose is the optimal strategy here.`,
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex w-full flex-col gap-6 lg:h-[calc(100vh-220px)] lg:min-h-130 lg:flex-row lg:items-stretch lg:overflow-hidden">

      {/* ── Left: Analysis panels (independently scrollable on desktop) ─ */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 min-w-0 space-y-4 lg:overflow-y-auto lg:pr-3 custom-scrollbar"
      >
        {/* Executive summary */}
        <motion.div
          variants={item}
          className="flex flex-col gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 sm:flex-row sm:items-start"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-white">AI Summary</h2>
            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed">
              <Markdown>{INSIGHTS.overview}</Markdown>
            </div>
          </div>
        </motion.div>

        {/* Complexity cards */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          {[
            { icon: Zap,   label: 'Time Complexity',  value: INSIGHTS.complexities.time,  sub: 'Optimal',   accent: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
            { icon: Code2, label: 'Space Complexity', value: INSIGHTS.complexities.space, sub: 'Efficient', accent: 'text-sky-400',     border: 'border-sky-500/20',     bg: 'bg-sky-500/5' },
          ].map(({ icon: Icon, label, value, sub, accent, border, bg }) => (
            <div key={label} className={`flex flex-col rounded-xl border ${border} ${bg} p-4`}>
              <div className="mb-3 flex items-center justify-between">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${border} bg-zinc-900/60`}>
                  <Icon className={`h-3.5 w-3.5 ${accent}`} />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">{sub}</span>
              </div>
              <div className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
              <p className="mt-1 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Collapsible analysis sections */}
        {SECTION_META.map(({ key, icon: Icon, label, accent, border, bg }) => (
          <motion.div key={key} variants={item} className={`overflow-hidden rounded-xl border ${border} ${bg}`}>
            <button
              onClick={() => setExpandedApproach(expandedApproach === key ? null : key)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/2"
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${accent}`} />
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
              {expandedApproach === key
                ? <ChevronUp className="h-4 w-4 text-zinc-500" />
                : <ChevronDown className="h-4 w-4 text-zinc-500" />}
            </button>
            <AnimatePresence>
              {expandedApproach === key && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/[0.07] px-5 py-4">
                    <div className="prose prose-invert prose-sm max-w-none text-zinc-400 leading-relaxed">
                      <Markdown>{INSIGHTS[key]}</Markdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Community approaches */}
        <motion.div variants={item} className="overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-900/50">
          <div className="flex items-center gap-2.5 border-b border-white/[0.07] bg-zinc-950/40 px-5 py-4">
            <Users className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-white">Community Approaches</h3>
          </div>
          <div className="divide-y divide-white/5">
            {INSIGHTS.uniqueApproaches.map((approach, idx) => (
              <div key={idx} className="px-5 py-5 space-y-4">
                {/* Author + title */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] bg-zinc-800">
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{approach.username}</div>
                      <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">{approach.source}</div>
                    </div>
                  </div>
                  <span className="rounded-lg border border-white/[0.07] bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-300">
                    {approach.title}
                  </span>
                </div>

                {/* Analysis */}
                <div className="prose prose-invert prose-sm max-w-none text-zinc-400 leading-relaxed">
                  <Markdown>{approach.analysis}</Markdown>
                </div>

                {/* Code */}
                <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-zinc-950">
                  <div className="border-b border-white/[0.07] px-4 py-2 font-mono text-[10px] tracking-widest text-violet-400 uppercase">
                    Code
                  </div>
                  <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-zinc-300 font-mono">
                    <code>{approach.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Right: AI chat (fills remaining height on desktop) ───────── */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="w-full shrink-0 lg:w-96 lg:h-full"
      >
        <div className="flex h-full max-h-150 lg:max-h-none flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/60">

          {/* Chat header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] bg-zinc-950/50 px-4 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
              <Bot className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    msg.role === 'user'
                      ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
                      : 'border-violet-500/20 bg-violet-500/10 text-violet-400'
                  }`}
                >
                  {msg.role === 'user' ? <User className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                </div>
                <div
                  className={`max-w-[84%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm border border-indigo-500/20 bg-indigo-500/10 text-zinc-200'
                      : 'rounded-tl-sm border border-white/[0.07] bg-zinc-800/60 text-zinc-300'
                  }`}
                >
                  <div className="prose prose-invert prose-xs max-w-none text-inherit [&_p]:mb-1.5 [&_p:last-child]:mb-0">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2.5"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400">
                  <Sparkles className="h-3 w-3" />
                </div>
                <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm border border-white/[0.07] bg-zinc-800/60 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-white/[0.07] bg-zinc-950/50 p-3">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about approach, complexity, edge cases..."
                className="flex-1 min-w-0 rounded-xl border border-white/[0.07] bg-zinc-900/80 px-3.5 py-2.5 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400 transition-all hover:border-violet-400/50 hover:bg-violet-500/20 disabled:pointer-events-none disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
