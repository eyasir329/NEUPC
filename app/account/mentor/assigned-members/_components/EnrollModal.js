/**
 * @file Enroll modal component
 * @module EnrollModal
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Search, Loader2, BookOpen, Check } from 'lucide-react';
import {
  searchUsersForEnrollment,
  adminAddEnrollment,
} from '@/app/_lib/actions/bootcamp-actions';
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
    if (query.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        setResults((await searchUsersForEnrollment(bootcampId, query)) || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query, bootcampId]);

  const pick = (u) => {
    if (!selected.find((s) => s.id === u.id)) setSelected((p) => [...p, u]);
    setQuery('');
    setResults([]);
  };
  const remove = (id) => setSelected((p) => p.filter((u) => u.id !== id));

  const submit = async () => {
    if (!selected.length) return;
    setAdding(true);
    try {
      await adminAddEnrollment(
        bootcampId,
        selected.map((u) => u.id)
      );
      toast.success(`${selected.length} student(s) enrolled!`);
      onSuccess();
    } catch (e) {
      toast.error(e.message || 'Failed to enroll');
    } finally {
      setAdding(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 text-zinc-300 shadow-2xl backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-violet-500/8 blur-[80px]" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/5 bg-white/2 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Plus className="h-4 w-4 text-violet-400" /> Enroll students
            </h3>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative z-10 space-y-4 p-5">
            {/* Bootcamp select */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                Bootcamp
              </label>
              <div className="relative">
                <select
                  value={bootcampId}
                  onChange={(e) => {
                    setBootcampId(e.target.value);
                    setSelected([]);
                  }}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 py-2.5 pr-8 pl-3.5 text-sm text-zinc-200 transition-all outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                >
                  {bootcamps.map((bc) => (
                    <option key={bc.id} value={bc.id}>
                      {bc.title}
                    </option>
                  ))}
                </select>
                <BookOpen className="pointer-events-none absolute top-1/2 right-3.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                Search candidates
              </label>
              <div className="group relative">
                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-violet-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pr-10 pl-10 text-sm text-zinc-200 transition-all outline-none placeholder:text-zinc-600 focus:border-violet-500/50 focus:bg-zinc-900 focus:ring-2 focus:ring-violet-500/20"
                />
                {searching && (
                  <Loader2 className="absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 animate-spin text-violet-400" />
                )}
              </div>

              {results.length > 0 && (
                <div className="mt-2 max-h-40 divide-y divide-white/5 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/80">
                  {results.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => pick(u)}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5"
                    >
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatar_url}
                          className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
                          alt=""
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/15 text-[10px] font-bold text-violet-300">
                          {u.full_name?.[0] || '?'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {u.full_name || 'Unknown'}
                        </p>
                        <p className="truncate text-[11px] text-zinc-500">
                          {u.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {query.length >= 2 && !searching && results.length === 0 && (
                <p className="mt-2 text-center text-xs text-zinc-600">
                  No users found for &quot;{query}&quot;
                </p>
              )}
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  Selected ({selected.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 py-1 pr-1.5 pl-2.5 text-xs text-violet-200"
                    >
                      {u.full_name || u.email}
                      <button
                        onClick={() => remove(u.id)}
                        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-violet-400 transition-colors hover:bg-violet-500/30 hover:text-white"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!selected.length || adding}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-200 shadow-sm transition-all hover:bg-violet-500/25 disabled:opacity-40"
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {adding
                  ? 'Enrolling…'
                  : `Enroll${selected.length ? ` (${selected.length})` : ''}`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
