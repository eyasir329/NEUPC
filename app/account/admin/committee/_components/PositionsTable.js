import { Edit3, Trash2 } from 'lucide-react';

function CategoryBadge({ category }) {
  const styles = {
    executive: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    mentor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    advisor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
        styles[category] ||
        'bg-gray-500/10 text-gray-400 border-gray-500/20'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          {
            executive: 'bg-purple-400',
            mentor: 'bg-cyan-400',
            advisor: 'bg-amber-400',
          }[category] || 'bg-gray-400'
        }`}
      />
      {category}
    </span>
  );
}

export default function PositionsTable({ positions, onEdit, onDelete }) {
  if (positions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden backdrop-blur-md">
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="w-12 px-5 py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
                #
              </th>
              <th className="px-5 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-5 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-5 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="hidden px-5 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider lg:table-cell">
                Display Order
              </th>
              <th className="px-5 py-4 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {positions.map((position, index) => (
              <tr
                key={position.id}
                className="group transition-colors hover:bg-white/4"
              >
                <td className="px-5 py-4 text-center font-mono text-[10px] text-gray-500 select-none">
                  {String(index + 1).padStart(2, '0')}
                </td>
                <td className="px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                      {position.title}
                    </p>
                    {position.responsibilities && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1 max-w-md">
                        {position.responsibilities}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <CategoryBadge category={position.category} />
                </td>
                <td className="px-5 py-4 text-sm text-gray-300 font-medium">
                  {position.rank ?? '—'}
                </td>
                <td className="hidden px-5 py-4 text-sm text-gray-300 font-medium lg:table-cell">
                  {position.display_order ?? '0'}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(position)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-400 active:scale-95"
                      title="Edit Position"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(position.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 active:scale-95"
                      title="Delete Position"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="divide-y divide-white/6 md:hidden">
        {positions.map((position, index) => (
          <div
            key={position.id}
            className="p-5 transition-colors hover:bg-white/4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-gray-500">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm font-semibold text-white truncate">
                    {position.title}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <CategoryBadge category={position.category} />
                  <span className="text-xs text-gray-500">
                    Rank: <span className="text-gray-300 font-medium">{position.rank ?? '—'}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onEdit(position)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-indigo-500/10 hover:border-indigo-500/20 hover:text-indigo-400 active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(position.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {position.responsibilities && (
              <p className="text-xs text-gray-500 leading-relaxed font-normal bg-white/2 border border-white/6 rounded-lg p-2.5">
                {position.responsibilities}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
