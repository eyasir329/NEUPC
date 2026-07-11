/**
 * @file Admin settings client — top-level layout and save flow.
 * Sections config and field editors live in sibling modules.
 * @module SettingsClient
 */

'use client';

import { saveSettingsAction, seedDefaultSettingsAction } from '@/app/_lib/actions/settings-actions';
import { EmptyState, PageHeader, PageShell } from '@/app/account/_components/ui';
import { AlertCircle, Check, CheckCircle2, Database, Loader2, RotateCcw, Save, Search, Settings, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { countFields, parseFieldGroups } from './settings-editors';
import { QuickTogglesWidget, SearchResultsView, SectionPanel } from './settings-fields';
import { SECTIONS, SIDEBAR_GROUPS } from './settings-sections';

export default function SettingsClient({ initialSettings }) {
  const [activeSection, setActiveSection] = useState('content');
  const [seeding, startSeed] = useTransition();
  const [isPending, startSave] = useTransition();
  const [seedMsg, setSeedMsg] = useState(null);
  const [msg, setMsg] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const router = useRouter();

  // Accent mapping for category sidebar elements
  const categoryAccents = {
    content: {
      color: 'blue',
      border: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
      glow: 'shadow-[0_0_8px_rgba(59,130,246,0.15)]',
    },
    features: {
      color: 'emerald',
      border: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]',
    },
    users: {
      color: 'cyan',
      border: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
      glow: 'shadow-[0_0_8px_rgba(6,182,212,0.15)]',
    },
    applications: {
      color: 'teal',
      border: 'border-teal-500/20 bg-teal-500/5 text-teal-400',
      glow: 'shadow-[0_0_8px_rgba(20,184,166,0.15)]',
    },
    events: {
      color: 'orange',
      border: 'border-orange-500/20 bg-orange-500/5 text-orange-400',
      glow: 'shadow-[0_0_8px_rgba(249,115,22,0.15)]',
    },
    blogs: {
      color: 'sky',
      border: 'border-sky-500/20 bg-sky-500/5 text-sky-400',
      glow: 'shadow-[0_0_8px_rgba(14,165,233,0.15)]',
    },
    notifications: {
      color: 'indigo',
      border: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
      glow: 'shadow-[0_0_8px_rgba(99,102,241,0.15)]',
    },
    security: {
      color: 'rose',
      border: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
      glow: 'shadow-[0_0_8px_rgba(244,63,94,0.15)]',
    },
    maintenance: {
      color: 'amber',
      border: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.15)]',
    },
  };

  /* Build full unified state from server data */
  const buildInitialState = useCallback(() => {
    const s = { ...initialSettings };
    SECTIONS.forEach((section) => {
      section.fields.forEach((f) => {
        if (f.type === 'divider') return;
        if (s[f.key] === undefined) {
          if (f.type === 'toggle') {
            s[f.key] = false;
          } else if (f.type === 'number') {
            s[f.key] = 0;
          } else if (f.type === 'json') {
            s[f.key] = [];
          } else {
            s[f.key] = '';
          }
        }
      });
    });
    return s;
  }, [initialSettings]);

  const [values, setValues] = useState(buildInitialState);
  const [savedSnapshot, setSavedSnapshot] = useState(buildInitialState);

  /* Keep full state in sync when server loads new defaults */
  useEffect(() => {
    const initial = buildInitialState();
    setValues(initial);
    setSavedSnapshot(initial);
  }, [initialSettings, buildInitialState]);

  /* Dirty check across entire state */
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(savedSnapshot),
    [values, savedSnapshot]
  );

  /* Count open/collapsed groups for active section */
  const currentSection = SECTIONS.find((s) => s.id === activeSection);
  const hasSettings = Object.keys(initialSettings).length > 0;

  const labeledGroups = useMemo(() => {
    if (!currentSection) return [];
    return parseFieldGroups(currentSection.fields).filter((g) => g.label);
  }, [currentSection]);

  const isLarge = labeledGroups.length > 4;

  const [openGroups, setOpenGroups] = useState(() => {
    const set = new Set();
    if (!isLarge) labeledGroups.forEach((g) => set.add(g.label));
    return set;
  });

  // Re-sync collapse states when category section changes
  useEffect(() => {
    setOpenGroups(() => {
      const set = new Set();
      if (!isLarge) labeledGroups.forEach((g) => set.add(g.label));
      return set;
    });
    setLocalSearch('');
  }, [activeSection, isLarge, labeledGroups]);

  function handleChange(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  /* Global Save Handler */
  async function handleSave() {
    startSave(async () => {
      // JSON Validation
      for (const section of SECTIONS) {
        for (const f of section.fields) {
          if (f.type === 'json' && typeof values[f.key] === 'string') {
            try {
              JSON.parse(values[f.key]);
            } catch {
              flash(
                'error',
                `Invalid JSON in "${f.label}". Fix and try again.`
              );
              return;
            }
          }
        }
      }

      // Collect only the DIRTY settings (optimizes DB writes)
      const dirtyEntries = [];
      SECTIONS.forEach((s) => {
        s.fields.forEach((f) => {
          if (f.type === 'divider') return;
          const currentVal = values[f.key];
          const snapVal = savedSnapshot[f.key];

          if (JSON.stringify(currentVal) !== JSON.stringify(snapVal)) {
            let val = currentVal;
            if (val === undefined || val === null) {
              if (f.type === 'toggle') val = false;
              else if (f.type === 'number') val = 0;
              else if (f.type === 'json') val = [];
              else val = '';
            }

            dirtyEntries.push({
              key: f.key,
              value:
                typeof val === 'string' && f.type === 'json'
                  ? JSON.parse(val)
                  : val,
              description: f.desc || null,
              category: f.category || s.id,
            });
          }
        });
      });

      if (dirtyEntries.length === 0) {
        flash('success', 'All changes already saved');
        return;
      }

      const fd = new FormData();
      fd.set('category', activeSection);
      fd.set('entries', JSON.stringify(dirtyEntries));

      const result = await saveSettingsAction(fd);
      if (result?.error) {
        flash('error', result.error);
      } else {
        flash('success', `Successfully saved ${dirtyEntries.length} settings!`);
        setSavedSnapshot({ ...values });
        router.refresh();
      }
    });
  }

  /* Keyboard shortcut support (Ctrl + S or CMD + S) */
  const saveRef = useRef(handleSave);
  useEffect(() => {
    saveRef.current = handleSave;
  });

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveRef.current?.();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleSeedDefaults() {
    startSeed(async () => {
      const result = await seedDefaultSettingsAction();
      if (result?.error) {
        setSeedMsg({ type: 'error', text: result.error });
      } else {
        setSeedMsg({
          type: 'success',
          text: `Seeded ${result.count} default settings successfully. Reloading platform...`,
        });
        setTimeout(() => window.location.reload(), 1500);
      }
      setTimeout(() => setSeedMsg(null), 4500);
    });
  }

  return (
    <PageShell>
      {/* ── Page Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Settings"
        subtitle="Manage platform configurations, default roles, visual page contents, and feature locks."
        icon={Settings}
        accent="blue"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/account/admin"
              className="rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white"
            >
              ← Dashboard
            </Link>
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white active:scale-[0.98] disabled:opacity-50"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4 text-gray-500" />
              )}
              {seeding
                ? 'Seeding...'
                : hasSettings
                  ? 'Reset All to Defaults'
                  : 'Seed Defaults'}
            </button>
          </div>
        }
      />

      {/* ── Seed notification message ────────────────────────────── */}
      {seedMsg && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            seedMsg.type === 'error'
              ? 'border-rose-500/20 bg-rose-500/5 text-rose-300'
              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
          }`}
        >
          {seedMsg.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {seedMsg.text}
        </div>
      )}

      {/* ── Empty state configuration defaults ───────────────────── */}
      {!hasSettings && (
        <EmptyState
          icon={Sparkles}
          title="No settings configured"
          description="Get started by seeding the default settings. You can customize everything after."
          action={
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-400 active:scale-[0.98] disabled:opacity-60"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {seeding ? 'Seeding...' : 'Seed Default Settings'}
            </button>
          }
        />
      )}

      {/* ── Master Status Toggles Widget ─────────────────────────── */}
      {hasSettings && (
        <QuickTogglesWidget
          values={values}
          onChange={handleChange}
          disabled={isPending}
        />
      )}

      {/* ── Main Layout Workspace ────────────────────────────────── */}
      {hasSettings && (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ── Left Sidebar Navigation ────────────────────────────── */}
          <aside className="shrink-0 lg:w-64">
            {/* Unified Global Settings Search bar */}
            <div className="relative mb-5 hidden lg:block">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Global settings search..."
                className="w-full rounded-xl border border-white/6 bg-white/2 py-3.5 pr-10 pl-10 text-xs text-gray-200 transition-all placeholder:text-gray-600 focus:border-white/12 focus:bg-white/4 focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-md p-0.5 text-gray-500 hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile View Navigation (horizontal scrolling tabs) */}
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto py-1 lg:hidden">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = activeSection === s.id && !globalSearch;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSection(s.id);
                      setGlobalSearch('');
                    }}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'border border-white/10 bg-white/10 text-white'
                        : 'border border-transparent text-gray-500 hover:bg-white/4 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Desktop: Grouped sidebar list */}
            <nav className="hidden space-y-6 lg:block">
              {SIDEBAR_GROUPS.map((group) => {
                const groupSections = group.ids
                  .map((id) => SECTIONS.find((s) => s.id === id))
                  .filter(Boolean);
                if (groupSections.length === 0) return null;

                return (
                  <div key={group.label} className="space-y-2">
                    <p className="px-3 text-[10px] font-bold tracking-[0.15em] text-gray-600 uppercase">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {groupSections.map((s) => {
                        const Icon = s.icon;
                        const active = activeSection === s.id && !globalSearch;
                        const fc = countFields(s);
                        const accent = categoryAccents[s.id] || {
                          color: 'blue',
                          border: 'border-white/10 bg-white/5',
                          glow: '',
                        };

                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveSection(s.id);
                              setGlobalSearch('');
                            }}
                            className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold transition-all duration-200 ${
                              active
                                ? `border border-white/[0.08] bg-white/[0.06] text-white ${accent.glow}`
                                : 'border border-transparent text-gray-500 hover:bg-white/[0.02] hover:text-gray-300'
                            }`}
                          >
                            {/* Color accented left indicator light */}
                            <div
                              className={`absolute top-3.5 bottom-3.5 left-0 w-1 rounded-full transition-transform ${
                                active
                                  ? `bg-${accent.color}-500 scale-100`
                                  : 'scale-0'
                              }`}
                            />

                            <Icon
                              className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                                active
                                  ? `text-${accent.color}-400`
                                  : 'text-gray-600 group-hover:text-gray-400'
                              }`}
                            />

                            <span className="flex-1 text-left">{s.label}</span>
                            <span
                              className={`rounded-md border px-1.5 py-0.25 text-[10px] font-semibold tabular-nums transition-colors ${
                                active
                                  ? 'border-white/8 bg-white/5 text-gray-400'
                                  : 'border-transparent text-gray-700 group-hover:text-gray-500'
                              }`}
                            >
                              {fc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* ── Content View Workspace Panel ───────────────────────── */}
          <div className="min-w-0 flex-1 rounded-2xl border border-white/6 bg-white/[0.01] p-5 shadow-2xl backdrop-blur-xl sm:p-6.5">
            {msg && (
              <div
                className={`mb-5 flex items-center gap-2.5 rounded-xl border px-4.5 py-3 text-sm ${
                  msg.type === 'error'
                    ? 'border-rose-500/20 bg-rose-500/5 text-rose-300'
                    : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                }`}
              >
                {msg.type === 'error' ? (
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 animate-bounce" />
                )}
                <span className="flex-1">{msg.text}</span>
              </div>
            )}

            {/* Render search results if there is a query */}
            {globalSearch.trim() ? (
              <SearchResultsView
                query={globalSearch}
                values={values}
                onChange={handleChange}
                disabled={isPending}
              />
            ) : (
              currentSection && (
                <SectionPanel
                  key={currentSection.id}
                  section={currentSection}
                  values={values}
                  onChange={handleChange}
                  disabled={isPending}
                  openGroups={openGroups}
                  setOpenGroups={setOpenGroups}
                  search={localSearch}
                  setSearch={setLocalSearch}
                />
              )
            )}

            {/* ── Sticky Unsaved Changes Save Bar ────────────────── */}
            <div
              className={`sticky bottom-0 z-20 -mx-5 mt-7 -mb-5 flex items-center justify-between gap-4 border-t border-white/8 bg-gray-950/75 px-5 py-4.5 backdrop-blur-2xl transition-all duration-300 sm:-mx-6.5 sm:-mb-6.5 sm:px-6.5 ${
                isDirty
                  ? 'translate-y-0 opacity-100 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]'
                  : 'pointer-events-none translate-y-3 opacity-0'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-400">
                <div className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
                You have unsaved changes across settings.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setValues(buildInitialState());
                  }}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-gray-300 disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" />
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isPending ? 'Saving...' : 'Save Changes'}
                  <span className="ml-1 hidden rounded-md border border-white/5 bg-white/10 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-blue-200 shadow-inner sm:inline">
                    ⌘S
                  </span>
                </button>
              </div>
            </div>

            {/* ── Static confirmation footer (when clean) ────────── */}
            {!isDirty && (
              <div className="mt-6 flex items-center justify-end border-t border-white/5 pt-5">
                <button
                  disabled
                  className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/2 px-4 py-2.5 text-xs font-semibold text-gray-600 opacity-60 transition-all"
                >
                  <Check className="h-4 w-4" />
                  All configurations are up to date
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
