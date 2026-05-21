'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, Loader2, BookOpen, Check } from 'lucide-react';
import { searchUsersForEnrollment, adminAddEnrollment } from '@/app/_lib/bootcamp-actions';
import toast from 'react-hot-toast';

export function EnrollModal({ bootcamps, onClose, onSuccess }) {
  const [bootcampId, setBootcampId] = useState(bootcamps[0]?.id || '');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try { setResults(await searchUsersForEnrollment(bootcampId, query) || []); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query, bootcampId]);

  const pick = u => { if (!selected.find(s => s.id === u.id)) setSelected(p => [...p, u]); setQuery(''); setResults([]); };
  const remove = id => setSelected(p => p.filter(u => u.id !== id));

  const submit = async () => {
    if (!selected.length) return;
    setAdding(true);
    try {
      await adminAddEnrollment(bootcampId, selected.map(u => u.id));
      toast.success(`${selected.length} student(s) enrolled!`);
      onSuccess();
    } catch (e) { toast.error(e.message || 'Failed to enroll'); }
    finally { setAdding(false); }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0c10]/95 backdrop-blur-xl shadow-2xl z-10 text-gray-300 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4.5 border-b border-white/[0.06] bg-white/[0.01]">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Plus className="w-4 h-4 text-violet-400" /> Enroll Candidate
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.04] text-gray-500 hover:text-slate-200 transition duration-300 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Bootcamp select */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Target Bootcamp Track</label>
              <div className="relative">
                <select value={bootcampId} onChange={e => { setBootcampId(e.target.value); setSelected([]); }}
                  className="w-full appearance-none bg-[#0c0d12]/50 hover:bg-[#0c0d12]/80 border border-white/[0.08] text-xs rounded-xl pl-3.5 pr-8 py-2.5 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40 transition-all duration-300 cursor-pointer">
                  {bootcamps.map(bc => <option key={bc.id} value={bc.id}>{bc.title}</option>)}
                </select>
                <BookOpen className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Search candidates</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or email…"
                  className="w-full bg-[#0c0d12]/50 hover:bg-[#0c0d12]/80 border border-white/[0.08] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40 transition-all duration-300" />
                {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-violet-400" />}
              </div>

              {results.length > 0 && (
                <div className="mt-1.5 rounded-xl border border-white/[0.06] bg-[#0a0e15]/90 max-h-36 overflow-y-auto divide-y divide-white/[0.04]">
                  {results.map(u => (
                    <button key={u.id} onClick={() => pick(u)} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left cursor-pointer">
                      {u.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={u.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                        : <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-300">{u.full_name?.[0] || '?'}</div>}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{u.full_name || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {query.length >= 2 && !searching && results.length === 0 && (
                <p className="mt-2 text-center text-xs text-gray-600 italic font-mono">No users found for &quot;{query}&quot;</p>
              )}
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Selected Candidates ({selected.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.map(u => (
                    <span key={u.id} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 font-mono">
                      {u.full_name || u.email}
                      <button onClick={() => remove(u.id)} className="w-3.5 h-3.5 rounded-full hover:bg-violet-500/30 flex items-center justify-center text-violet-400 hover:text-white transition-colors cursor-pointer">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
              <button onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white rounded-xl hover:bg-white/[0.04] transition-all duration-300 cursor-pointer">Cancel</button>
              <button onClick={submit} disabled={!selected.length || adding}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-violet-500/20 bg-violet-500/10 hover:bg-violet-500/25 text-violet-300 text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-all duration-300 shadow-sm cursor-pointer">
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {adding ? 'Enrolling…' : `Enroll${selected.length ? ` (${selected.length})` : ''}`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
