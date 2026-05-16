'use client';

import {
  Calendar,
  CheckCircle,
  CheckCircle2,
  Award,
  MessageSquare,
  BookOpen,
  FileText,
  Activity,
  ArrowRight,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

const ICON_MAP = {
  Calendar: Calendar,
  CheckCircle: CheckCircle2,
  CheckCircle2: CheckCircle2,
  Award: Trophy,
  Trophy: Trophy,
  MessageSquare: MessageSquare,
  BookOpen: BookOpen,
  FileText: FileText,
};

const TONE_TO_TW = {
  emerald: { text: 'text-emerald-400', border: 'border-emerald-500/30' },
  blue: { text: 'text-blue-400', border: 'border-blue-500/30' },
  amber: { text: 'text-amber-400', border: 'border-amber-500/30' },
  violet: { text: 'text-violet-400', border: 'border-violet-500/30' },
  cyan: { text: 'text-cyan-400', border: 'border-cyan-500/30' },
  pink: { text: 'text-pink-400', border: 'border-pink-500/30' },
  rose: { text: 'text-rose-400', border: 'border-rose-500/30' },
};

const MAX_ITEMS = 4;

export default function RecentActivity({ recentActivities = [] }) {
  const visible = recentActivities.slice(0, MAX_ITEMS);
  const extra = recentActivities.length - visible.length;

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 rounded-2xl shrink-0">
             <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">Recent Activity</h3>
            <p className="text-xs text-zinc-500 mt-1">Your latest actions</p>
          </div>
        </div>
        {extra > 0 && (
          <Link 
            href="/account/member/participation" 
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 transition-colors shrink-0"
          >
            All {recentActivities.length} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="relative border-l border-white/10 ml-6 space-y-8 pb-2 mt-4">
        {visible.map((activity, i) => {
          const Icon = ICON_MAP[activity.icon] ?? Activity;
          const toneConfig = TONE_TO_TW[activity.tone] || TONE_TO_TW.emerald;
          
          return (
            <div key={i} className="relative pl-8 group cursor-pointer">
              {/* Timeline Dot */}
              <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border ${toneConfig.border} flex items-center justify-center shadow-lg shadow-black/40 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-4 h-4 ${toneConfig.text}`} />
              </div>
              
              <div className="pt-1">
                <h4 className="text-sm font-bold text-zinc-100 leading-tight mb-1 group-hover:text-indigo-400 transition-colors">
                  {activity.action}
                </h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
