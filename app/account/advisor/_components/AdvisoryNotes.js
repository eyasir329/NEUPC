'use client';

import { MessageSquare } from 'lucide-react';

export default function AdvisoryNotes() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">📝 Advisory Notes</h2>
          <p className="text-sm text-gray-400">
            Strategic guidance & recommendations
          </p>
        </div>
        <button className="flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
          <MessageSquare className="h-4 w-4" />
          Add Note
        </button>
      </div>
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
        <textarea
          placeholder="Add strategic recommendations, semester planning notes, or guidance for the executive committee..."
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
          rows={4}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button className="rounded bg-gray-500/20 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:bg-gray-500/30">
            Cancel
          </button>
          <button className="rounded bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}
