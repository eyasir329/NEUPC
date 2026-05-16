'use client';

import { Code2, TrendingUp, Calendar, Trophy, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function MemberStatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <StatCard 
        icon={<Code2 className="w-5 h-5 text-emerald-600" />}
        title="Problems Solved"
        value={stats.problemsSolved}
        subtitle="Across 5 platforms"
        badge="+12 / week"
        badgeType="success"
        href="/account/member/problem-solving"
      />
      <StatCard 
        icon={<TrendingUp className="w-5 h-5 text-violet-400" />}
        title="Contest Rating"
        value={stats.contestRating}
        subtitle="Specialist tier"
        badge="+34"
        badgeType="success"
        href="/account/member/problem-solving"
      />
      <StatCard 
        icon={<Calendar className="w-5 h-5 text-indigo-400" />}
        title="Upcoming Events"
        value={stats.upcomingEvents}
        subtitle="2 this week"
        href="/account/member/events"
      />
      <StatCard 
        icon={<Trophy className="w-5 h-5 text-amber-400" />}
        title="Achievements"
        value={stats.achievements}
        subtitle="2 in progress"
        href="/account/member/achievements"
      />
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, badge, badgeType, href }) {
  const content = (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:border-white/20 hover:shadow-lg hover:shadow-black/40 transition-all group h-full cursor-pointer">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-4xl font-light text-zinc-100">{value}</h3>
        </div>
        <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-2xl text-zinc-400 group-hover:scale-105 transition-transform duration-300">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <p className="text-zinc-500 font-medium">{subtitle}</p>
        {badge && (
          <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-2xl ${
            badgeType === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'bg-white/10 text-zinc-400'
          }`}>
            {badgeType === 'success' && <ArrowUpRight className="w-3 h-3" />}
            {badge}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }
  
  return content;
}
