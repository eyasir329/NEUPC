/**
 * @file Stat card — single metric card with icon, label, value,
 *   and optional trend indicator for the users dashboard.
 * @module AdminStatCard
 */

export default function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4 backdrop-blur-sm transition-colors hover:bg-white/5">
      <div className="flex items-center gap-3">
        <div className={`shrink-0 rounded-xl p-2.5 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-white tabular-nums">{value}</p>
          <p className="truncate text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
