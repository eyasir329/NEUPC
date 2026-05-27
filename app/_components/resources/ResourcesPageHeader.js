import Link from 'next/link';
import {
  BookOpen,
  Layers,
  FolderOpen,
  Pin,
  Sparkles,
  PlusCircle,
  Star,
  CheckCircle2,
} from 'lucide-react';

function StatBadge({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-2.5 border border-white/[0.06] backdrop-blur-md transition-all hover:bg-white/[0.06] hover:border-white/[0.1]">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
        <p className="text-[16px] font-bold tracking-tight text-white/95 leading-none mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/**
 * @param {'guest'|'member'|'admin'} props.role
 */
export default function ResourcesPageHeader({
  role,
  total = 0,
  categoryCount = 0,
  pinnedCount = 0,
  publishedCount,
  onCreateNew,
  children,
}) {
  const isGuest = role === 'guest';
  const isMember = role === 'member';
  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6 mb-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0b0d12] p-6 sm:p-10 shadow-2xl">
        {/* Subtle background effects */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-violet-600/15 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 mb-4 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-[11px] font-medium text-white/70">
                {isAdmin ? 'Admin Dashboard' : 'Member Hub'}
              </span>
            </div>
            
            <h1 className="text-[36px] sm:text-[44px] font-bold tracking-tight text-white leading-tight">
              {isAdmin ? 'Resource Management' : 'Resource Library'}
            </h1>
            <p className="mt-3 text-[15px] sm:text-[16px] leading-relaxed text-white/50 max-w-xl">
              {isGuest
                ? 'Explore public guides, tutorials, and materials curated by the club to accelerate your learning journey.'
                : isAdmin
                  ? 'Manage and distribute educational resources to members.'
                  : 'Access exclusive learning materials, guides, and tools carefully curated to boost your problem-solving skills.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {isGuest && (
                <>
                  <StatBadge icon={Layers} label="Resources" value={total} colorClass="text-blue-400" />
                  <StatBadge icon={FolderOpen} label="Categories" value={categoryCount} colorClass="text-purple-400" />
                </>
              )}
              {isMember && (
                <>
                  <StatBadge icon={Layers} label="Total Resources" value={total} colorClass="text-blue-400" />
                  <StatBadge icon={Pin} label="Pinned" value={pinnedCount} colorClass="text-amber-400" />
                  <StatBadge icon={FolderOpen} label="Categories" value={categoryCount} colorClass="text-purple-400" />
                </>
              )}
              {isAdmin && (
                <>
                  <StatBadge icon={BookOpen} label="Total" value={total} colorClass="text-blue-400" />
                  <StatBadge icon={CheckCircle2} label="Published" value={publishedCount ?? 0} colorClass="text-emerald-400" />
                  <StatBadge icon={Star} label="Pinned" value={pinnedCount} colorClass="text-amber-400" />
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {isAdmin && onCreateNew && (
              <button
                onClick={onCreateNew}
                className="group flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[13px] font-semibold text-black transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90" />
                New Resource
              </button>
            )}
            {isGuest && (
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-[13px] font-semibold text-white transition-all hover:bg-violet-500 hover:scale-[1.02] shadow-[0_0_20px_rgba(124,83,255,0.3)]"
              >
                <Sparkles className="h-4 w-4" />
                Become a Member
              </Link>
            )}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
