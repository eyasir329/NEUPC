/**
 * @file Achievements page client component — "Neon Obsidian" design.
 * Matches the reference HTML exactly with static demo content.
 *
 * @module AchievementsClient
 */

'use client';

import dynamic from 'next/dynamic';
const ScrollToTop = dynamic(() => import('../_components/ui/ScrollToTop'), {
  ssr: false,
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AchievementsClient() {
  return (
    <main>
      {/* ════════════════════════════════════════════════════
          Hero Section
          ════════════════════════════════════════════════════ */}
      <header className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/90 via-[#050505]/70 to-[#050505]" />
        </div>
        {/* Technical Overlay */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,92,255,0.1),transparent_70%)]" />
          <div className="font-mono text-[9px] text-neon-emerald p-10 leading-relaxed whitespace-pre overflow-hidden">
            {`[SYS_AUTH: SUCCESS]
[MODULE: ACHIEVEMENT_LOG_V2.0]
[STATUS: ACTIVE_RETRIEVAL]
>> TRACKING DIGITAL EXCELLENCE
>> DEP_CSE_NETROKONA_UNIVERSITY`}
          </div>
        </div>

        <div className="relative z-10 w-full max-w-screen-2xl px-10 flex flex-col items-start gap-12">
          <div className="w-full flex justify-end text-right">
            <div className="space-y-1">
              <p className="font-mono text-[10px] tracking-[0.4em] text-neon-violet uppercase font-bold">
                Hall of Achievements
              </p>
              <p className="font-mono text-[10px] tracking-[0.4em] text-zinc-500 uppercase">
                Operational Excellence
              </p>
            </div>
          </div>

          <h1 className="kinetic-headline font-headline text-[8vw] md:text-[8rem] font-black text-white uppercase leading-[0.85] select-none">
            HALL OF
            <br />
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: '1.5px #7C5CFF' }}
            >
              ACHIEVEMENTS
            </span>
          </h1>

          <div className="flex gap-6 items-center">
            <div className="w-20 h-[2px] bg-neon-emerald" />
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-[0.3em]">
              A technical lineage of digital excellence.
            </p>
          </div>
        </div>

        <div className="absolute bottom-20 left-10 glass-panel p-8 max-w-xs void-glow-violet">
          <span
            className="material-symbols-outlined text-neon-violet mb-6 text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            military_tech
          </span>
          <p className="font-mono text-[11px] leading-relaxed text-zinc-400 uppercase tracking-wider">
            DOCUMENTING THE HIGHEST STANDARDS OF COMPUTATIONAL TRIUMPH WITHIN
            THE NEUPC ECOSYSTEM.
          </p>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════
          Stats Section
          ════════════════════════════════════════════════════ */}
      <section className="py-32 bg-surface relative">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="text-center space-y-3 group">
              <div className="text-6xl font-headline font-black text-neon-violet tracking-tighter group-hover:scale-110 transition-transform">
                15+
              </div>
              <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-zinc-500 font-bold">
                ICPC Regionals
              </div>
            </div>
            <div className="text-center space-y-3 group">
              <div className="text-6xl font-headline font-black text-neon-emerald tracking-tighter group-hover:scale-110 transition-transform">
                50+
              </div>
              <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-zinc-500 font-bold">
                National Awards
              </div>
            </div>
            <div className="text-center space-y-3 group">
              <div className="text-6xl font-headline font-black text-white tracking-tighter group-hover:scale-110 transition-transform">
                200+
              </div>
              <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-zinc-500 font-bold">
                Solved / Member
              </div>
            </div>
            <div className="text-center space-y-3 group">
              <div className="text-6xl font-headline font-black text-neon-violet tracking-tighter group-hover:scale-110 transition-transform">
                5+
              </div>
              <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-zinc-500 font-bold">
                Global Rankings
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          Featured Victory (ICPC Spotlight)
          ════════════════════════════════════════════════════ */}
      <section className="py-40 bg-[#050505] relative px-10 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-6 mb-32">
            <span className="font-mono text-[10px] text-neon-emerald tracking-[0.5em] uppercase font-bold">
              Legacy Unit 01
            </span>
            <h2 className="text-7xl font-headline font-black uppercase tracking-tighter text-white">
              Featured{' '}
              <span className="text-neon-violet italic">Victory</span>
            </h2>
          </div>

          <div
            className="rounded-[3rem] p-16 flex flex-col lg:flex-row items-center gap-20"
            style={{
              background:
                'linear-gradient(135deg, rgba(124, 92, 255, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="lg:w-1/2 relative">
              <div className="aspect-square rounded-[2rem] overflow-hidden border border-neon-violet/30 p-2 bg-black/40">
                <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-neon-violet/20 to-neon-emerald/10 flex items-center justify-center">
                  <span className="text-8xl">🏆</span>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 bg-surface border border-outline p-6 void-glow-violet">
                <div className="text-4xl font-headline font-black text-neon-emerald">
                  12
                </div>
                <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                  Problems Solved
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 space-y-10">
              <span className="bg-neon-violet/10 text-neon-violet px-6 py-2 font-mono text-[10px] font-bold uppercase rounded-full border border-neon-violet/20 inline-block">
                Regional Champion 2024
              </span>
              <h3 className="text-5xl md:text-7xl font-headline font-black text-white italic tracking-tighter leading-none">
                ICPC ASIA DHAKA
              </h3>
              <p className="text-zinc-400 text-xl font-light leading-relaxed">
                Dominating the regional leaderboard with precision algorithms
                and elite teamwork. A historical milestone for NEUPC.
              </p>
              <div className="flex items-center gap-8">
                <div className="px-8 py-3 bg-surface border border-outline rounded-full">
                  <span className="font-headline font-black text-white uppercase italic tracking-tighter">
                    1st Place
                  </span>
                </div>
                <button className="bg-neon-emerald text-white px-10 py-4 rounded-full font-headline font-black text-[10px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all">
                  View Scoreboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          Victory Log Gallery
          ════════════════════════════════════════════════════ */}
      <section className="py-40 bg-surface px-10">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-outline-2 pb-12">
            <div className="space-y-4">
              <span className="text-neon-emerald font-mono font-bold uppercase tracking-[0.5em] text-[10px]">
                Operations log
              </span>
              <h2 className="text-6xl font-headline font-black text-white uppercase tracking-tighter">
                Victory Log
              </h2>
            </div>
            <div className="font-mono text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
              2023-2024 Cycle
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Log 1 */}
            <div className="group relative bg-[#050505] border border-outline p-8 rounded-[2rem] hover:border-neon-violet transition-all duration-500">
              <div className="aspect-video mb-8 overflow-hidden rounded-xl border border-outline/30 bg-gradient-to-br from-neon-violet/10 to-neon-emerald/5 flex items-center justify-center">
                <span className="text-6xl grayscale group-hover:grayscale-0 transition-all duration-700">
                  🏁
                </span>
              </div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-headline font-black text-white uppercase tracking-tighter">
                  BUET Inter-University
                </h3>
                <span className="material-symbols-outlined text-neon-emerald">
                  military_tech
                </span>
              </div>
              <p className="text-zinc-500 text-sm font-light leading-relaxed mb-10">
                Secured Top 5 position among 150+ teams in the most prestigious
                national coding combat.
              </p>
              <div className="flex gap-3">
                <span className="text-[9px] font-mono text-neon-violet border border-neon-violet/30 px-3 py-1 rounded-full uppercase font-bold">
                  Algorithms
                </span>
                <span className="text-[9px] font-mono text-neon-emerald border border-neon-emerald/30 px-3 py-1 rounded-full uppercase font-bold">
                  Top Tier
                </span>
              </div>
            </div>

            {/* Log 2 */}
            <div className="group relative bg-[#050505] border border-outline p-8 rounded-[2rem] hover:border-neon-emerald transition-all duration-500">
              <div className="aspect-video mb-8 overflow-hidden rounded-xl border border-outline/30 bg-gradient-to-br from-neon-emerald/10 to-neon-violet/5 flex items-center justify-center">
                <span className="text-6xl grayscale group-hover:grayscale-0 transition-all duration-700">
                  ⭐
                </span>
              </div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-headline font-black text-white uppercase tracking-tighter">
                  Girls Programming
                </h3>
                <span className="material-symbols-outlined text-neon-emerald">
                  star
                </span>
              </div>
              <p className="text-zinc-500 text-sm font-light leading-relaxed mb-10">
                Consistent podium finishes promoting diversity in high-level
                engineering and logic design.
              </p>
              <div className="flex gap-3">
                <span className="text-[9px] font-mono text-neon-violet border border-neon-violet/30 px-3 py-1 rounded-full uppercase font-bold">
                  Diversity
                </span>
                <span className="text-[9px] font-mono text-neon-emerald border border-neon-emerald/30 px-3 py-1 rounded-full uppercase font-bold">
                  Champions
                </span>
              </div>
            </div>

            {/* Log 3 */}
            <div className="group relative bg-[#050505] border border-outline p-8 rounded-[2rem] hover:border-neon-violet transition-all duration-500">
              <div className="aspect-video mb-8 overflow-hidden rounded-xl border border-outline/30 bg-gradient-to-br from-neon-violet/10 to-neon-emerald/5 flex items-center justify-center">
                <span className="text-6xl grayscale group-hover:grayscale-0 transition-all duration-700">
                  📈
                </span>
              </div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-headline font-black text-white uppercase tracking-tighter">
                  Codeforces Elite
                </h3>
                <span className="material-symbols-outlined text-neon-emerald">
                  trending_up
                </span>
              </div>
              <p className="text-zinc-500 text-sm font-light leading-relaxed mb-10">
                Collective growth milestone with over 10 members reaching
                Grandmaster and Master ranks.
              </p>
              <div className="flex gap-3">
                <span className="text-[9px] font-mono text-neon-violet border border-neon-violet/30 px-3 py-1 rounded-full uppercase font-bold">
                  Rankings
                </span>
                <span className="text-[9px] font-mono text-neon-emerald border border-neon-emerald/30 px-3 py-1 rounded-full uppercase font-bold">
                  Mastery
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          Participation Log Table
          ════════════════════════════════════════════════════ */}
      <section className="py-40 bg-[#050505] px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 mb-20">
            <h2 className="text-5xl font-headline font-black text-white uppercase italic tracking-tighter shrink-0">
              Participation Log
            </h2>
            <div className="flex-grow h-[1px] bg-outline-2" />
            <span className="font-mono text-neon-emerald text-[10px] font-bold tracking-widest uppercase shrink-0">
              Recent Missions
            </span>
          </div>

          <div className="bg-surface border border-outline rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#050505]/50 border-b border-outline">
                    <th className="py-8 px-10 font-mono text-[10px] text-neon-emerald uppercase tracking-widest">
                      Operator
                    </th>
                    <th className="py-8 px-10 font-mono text-[10px] text-neon-emerald uppercase tracking-widest">
                      Terminal
                    </th>
                    <th className="py-8 px-10 font-mono text-[10px] text-neon-emerald uppercase tracking-widest">
                      Position
                    </th>
                    <th className="py-8 px-10 font-mono text-[10px] text-neon-emerald uppercase tracking-widest">
                      Status
                    </th>
                    <th className="py-8 px-10 font-mono text-[10px] text-neon-emerald uppercase tracking-widest">
                      Archive
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/30">
                  {[
                    {
                      op: 'Alpha_Sector_01',
                      term: 'Meta Hacker Cup - R2',
                      pos: 'Top 500 Global',
                    },
                    {
                      op: 'Binary_Specter',
                      term: 'CF Global Round 27',
                      pos: 'Rank 142',
                    },
                    {
                      op: 'Logic_Engine',
                      term: 'IUPC - RUET 2024',
                      pos: 'Rank 8',
                    },
                    {
                      op: 'Void_Pointer',
                      term: 'LeetCode Weekly 412',
                      pos: 'Rank 22',
                    },
                  ].map((row) => (
                    <tr
                      key={row.op}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-8 px-10 font-mono text-xs text-white">
                        {row.op}
                      </td>
                      <td className="py-8 px-10 font-mono text-xs text-zinc-500">
                        {row.term}
                      </td>
                      <td className="py-8 px-10 font-headline font-bold text-neon-violet">
                        {row.pos}
                      </td>
                      <td className="py-8 px-10">
                        <span className="bg-neon-emerald/10 text-neon-emerald border border-neon-emerald/20 px-4 py-1.5 rounded-full font-mono text-[9px] font-bold uppercase">
                          Executed
                        </span>
                      </td>
                      <td className="py-8 px-10">
                        <a
                          className="text-white hover:text-neon-violet transition-colors flex items-center gap-2 font-mono text-[10px] uppercase font-bold"
                          href="#"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            visibility
                          </span>{' '}
                          Gallery
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          Member Spotlight Section
          ════════════════════════════════════════════════════ */}
      <section className="py-40 bg-surface px-10">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <h2 className="text-6xl font-headline font-black text-white uppercase italic tracking-tighter shrink-0">
              Member Spotlight
            </h2>
            <div className="flex-grow h-[1px] bg-outline-2" />
            <span className="font-mono text-neon-violet text-[10px] font-bold tracking-widest uppercase shrink-0">
              Titan Units
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Spotlight 1 */}
            <div className="bg-[#050505] border border-outline p-10 flex flex-col md:flex-row gap-10 items-center rounded-[3rem] group hover:border-neon-violet transition-all duration-700 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-32 h-32 flex-shrink-0 bg-neon-violet p-1 rounded-full overflow-hidden">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-neon-violet/30 to-surface flex items-center justify-center text-4xl font-headline font-black text-white">
                  MR
                </div>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex flex-wrap gap-3 items-center">
                  <h4 className="text-3xl font-headline font-black text-white uppercase tracking-tighter">
                    Mahbubur Rahman
                  </h4>
                  <span className="text-[9px] font-mono text-white bg-neon-violet px-3 py-1 font-bold uppercase tracking-widest">
                    Candidate Master
                  </span>
                </div>
                <p className="text-zinc-500 text-sm font-light leading-relaxed">
                  Reached 2100+ rating on Codeforces. Ranked #1 in the
                  university for 3 consecutive terms.
                </p>
                <div className="flex gap-10 pt-4">
                  <div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
                      Max Rating
                    </div>
                    <div className="text-xl font-headline font-black text-white">
                      2143
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
                      Solved
                    </div>
                    <div className="text-xl font-headline font-black text-white">
                      2,500+
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spotlight 2 */}
            <div className="bg-[#050505] border border-outline p-10 flex flex-col md:flex-row gap-10 items-center rounded-[3rem] group hover:border-neon-emerald transition-all duration-700 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-emerald/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-32 h-32 flex-shrink-0 bg-neon-emerald p-1 rounded-full overflow-hidden">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-neon-emerald/30 to-surface flex items-center justify-center text-4xl font-headline font-black text-white">
                  JF
                </div>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex flex-wrap gap-3 items-center">
                  <h4 className="text-3xl font-headline font-black text-white uppercase tracking-tighter">
                    Jannatul Firdaws
                  </h4>
                  <span className="text-[9px] font-mono text-white bg-neon-emerald px-3 py-1 font-bold uppercase tracking-widest">
                    Elite Leeter
                  </span>
                </div>
                <p className="text-zinc-500 text-sm font-light leading-relaxed">
                  Top 0.5% global rank on LeetCode. Expert in dynamic
                  programming and string algorithms.
                </p>
                <div className="flex gap-10 pt-4">
                  <div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
                      Leet Rank
                    </div>
                    <div className="text-xl font-headline font-black text-white">
                      Top 0.5%
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
                      Badges
                    </div>
                    <div className="text-xl font-headline font-black text-white">
                      14
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          Call to Action
          ════════════════════════════════════════════════════ */}
      <section className="py-40 bg-[#050505] px-10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-violet/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-16 relative z-10">
          <h2 className="text-7xl md:text-9xl font-headline font-black text-white uppercase leading-none tracking-tighter italic">
            WANT TO BE OUR NEXT{' '}
            <span className="text-neon-violet">CHAMPION?</span>
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-8">
            <button className="bg-neon-violet text-white px-16 py-6 rounded-full font-headline font-black text-sm uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all italic">
              Join the Elite
            </button>
            <button className="border-2 border-outline text-zinc-400 px-16 py-6 rounded-full font-headline font-black text-sm uppercase tracking-[0.3em] hover:border-neon-emerald hover:text-neon-emerald transition-all italic">
              Explore Curriculum
            </button>
          </div>
        </div>
      </section>

      <ScrollToTop />
    </main>
  );
}
