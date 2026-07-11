/**
 * @file Composed field widgets and section panels for admin settings.
 * @module settings-fields
 */

'use client';

import { GlassCard } from '@/app/account/_components/ui';
import { ChevronDown, Search, Settings2, X } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { Toggle, VisualJsonEditor, parseFieldGroups } from './settings-editors';
import { SECTIONS } from './settings-sections';

function QuickTogglesWidget({ values, onChange, disabled }) {
  const activeFeaturesCount = useMemo(() => {
    let active = 0;
    let total = 0;
    Object.entries(values).forEach(([k, v]) => {
      if (k.startsWith('features.')) {
        total++;
        if (v) active++;
      }
    });
    return { active, total };
  }, [values]);

  return (
    <GlassCard className="relative overflow-hidden border-white/[0.08] bg-gray-900/60 p-6 shadow-2xl backdrop-blur-xl">
      {/* Decorative top glow bar */}
      <div className="absolute top-0 right-0 left-0 h-0.75 bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 shadow-[0_1px_8px_rgba(59,130,246,0.5)]" />

      <div className="mb-4.5 flex items-center justify-between border-b border-white/6 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-200">
          <Settings2 className="h-4 w-4 animate-pulse text-blue-400" />
          System Overview & Quick Controls
        </h3>
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-gray-400">
          Instant Toggles
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Maintenance Toggle */}
        <div className="group rounded-xl border border-white/6 bg-white/[0.01] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.02]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${values['maintenance.enabled'] ? 'animate-ping bg-amber-400' : 'bg-emerald-500'}`}
              />
              <span className="text-xs font-semibold text-gray-300">
                Maintenance Mode
              </span>
            </div>
            <Toggle
              checked={!!values['maintenance.enabled']}
              onChange={(v) => onChange('maintenance.enabled', v)}
              disabled={disabled}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-gray-500">
            {values['maintenance.enabled']
              ? `Active: Non-admin users see fallback screen.`
              : 'Inactive: Platform open to the public.'}
          </p>
          {values['maintenance.enabled'] && (
            <div className="mt-2 truncate font-mono text-[9px] text-amber-400/90">
              End: {values['maintenance.expected_end'] || 'Not scheduled'}
            </div>
          )}
        </div>

        {/* Applications Toggle */}
        <div className="group rounded-xl border border-white/6 bg-white/[0.01] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.02]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${values['applications.accept_applications'] ? 'animate-pulse bg-emerald-500' : 'bg-gray-600'}`}
              />
              <span className="text-xs font-semibold text-gray-300">
                Accept Applications
              </span>
            </div>
            <Toggle
              checked={!!values['applications.accept_applications']}
              onChange={(v) => onChange('applications.accept_applications', v)}
              disabled={disabled}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-gray-500">
            {values['applications.accept_applications']
              ? 'Open: Guest users can apply to be members.'
              : 'Closed: Membership applications disabled.'}
          </p>
          {values['applications.accept_applications'] && (
            <div className="mt-2 text-[9px] text-gray-400">
              Max per year:{' '}
              <span className="font-semibold text-white tabular-nums">
                {values['applications.max_per_year'] || '100'}
              </span>
            </div>
          )}
        </div>

        {/* Registration Toggle */}
        <div className="group rounded-xl border border-white/6 bg-white/[0.01] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.02]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${values['users.registration_enabled'] ? 'animate-pulse bg-blue-400' : 'bg-rose-500'}`}
              />
              <span className="text-xs font-semibold text-gray-300">
                User Registrations
              </span>
            </div>
            <Toggle
              checked={!!values['users.registration_enabled']}
              onChange={(v) => onChange('users.registration_enabled', v)}
              disabled={disabled}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-gray-500">
            {values['users.registration_enabled']
              ? 'Allowed: New users can sign up.'
              : 'Blocked: Nobody can register new accounts.'}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[9px] text-gray-400">
            Email Verification:
            <span
              className={`font-semibold ${values['users.require_email_verification'] ? 'text-amber-400' : 'text-emerald-400'}`}
            >
              {values['users.require_email_verification']
                ? 'Required'
                : 'Bypassed'}
            </span>
          </div>
        </div>

        {/* Active Features stats */}
        <div className="group flex flex-col justify-between rounded-xl border border-white/6 bg-white/[0.01] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.02]">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">
                Active Features
              </span>
              <span className="text-xs font-bold text-emerald-400 tabular-nums">
                {activeFeaturesCount.active}/{activeFeaturesCount.total}
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-white/4 bg-white/5">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-300"
                style={{
                  width: `${(activeFeaturesCount.active / activeFeaturesCount.total) * 100}%`,
                }}
              />
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            Control chat modules, certificates, notice boards, and roadmap tabs.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Field Renderer ───────────────────────────────────────────────────────────

function SettingField({ field, value, onChange, disabled }) {
  if (field.type === 'toggle') {
    return (
      <div className="col-span-full">
        <div
          className={`group flex items-center justify-between gap-4 rounded-xl border px-4.5 py-4 backdrop-blur-md transition-all duration-300 ${
            value
              ? 'border-blue-500/25 bg-blue-500/[0.03] shadow-[inset_0_1px_8px_rgba(59,130,246,0.05)]'
              : 'border-white/6 bg-white/1 hover:border-white/10 hover:bg-white/2'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-gray-200">{field.label}</p>
            {field.desc && (
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                {field.desc}
              </p>
            )}
          </div>
          <Toggle checked={!!value} onChange={onChange} disabled={disabled} />
        </div>
      </div>
    );
  }

  if (field.type === 'json') {
    return (
      <VisualJsonEditor
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  const inputCls =
    'w-full rounded-xl border border-white/8 bg-white/2 px-4 py-3 text-xs text-gray-100 placeholder:text-gray-600 backdrop-blur-md transition-all duration-200 focus:border-blue-500/30 focus:bg-white/4 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:opacity-40 disabled:cursor-not-allowed';

  const labelEl = (
    <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
      {field.label}
    </label>
  );

  const descEl = field.desc ? (
    <p className="text-[11px] leading-relaxed text-gray-600">{field.desc}</p>
  ) : null;

  if (field.type === 'select') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelEl}
        {descEl}
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${inputCls} cursor-pointer [&>option]:bg-gray-900`}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'color') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelEl}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value ?? '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="h-10 w-14 cursor-pointer rounded-xl border border-white/8 bg-white/3 p-1 disabled:opacity-40"
          />
          <input
            type="text"
            value={value ?? '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="#3b82f6"
            className={`${inputCls} font-mono`}
          />
        </div>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="col-span-full flex flex-col gap-1.5">
        {labelEl}
        {descEl}
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder={field.placeholder}
          className={`${inputCls} resize-none leading-relaxed`}
        />
      </div>
    );
  }

  // text, email, url, number — with optional icon
  const FieldIcon = field.icon;
  return (
    <div className="flex flex-col gap-1.5">
      {labelEl}
      {descEl}
      <div className="relative">
        {FieldIcon && (
          <FieldIcon className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
        )}
        <input
          type={field.type}
          value={value ?? ''}
          onChange={(e) => {
            const v =
              field.type === 'number' ? Number(e.target.value) : e.target.value;
            onChange(v);
          }}
          disabled={disabled}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          className={`${inputCls} ${FieldIcon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  );
}

// ─── Collapsible Field Group ──────────────────────────────────────────────────

function FieldGroup({
  label,
  fields,
  values,
  onChange,
  disabled,
  open,
  onToggle,
  scrollRef,
}) {
  // Ungrouped fields (no divider label)
  if (!label) {
    return fields.map((field) => (
      <SettingField
        key={field.key}
        field={field}
        value={values[field.key]}
        onChange={(val) => onChange(field.key, val)}
        disabled={disabled}
      />
    ));
  }

  const filledCount = fields.filter((f) => {
    const v = values[f.key];
    if (f.type === 'toggle') return !!v;
    if (v === undefined || v === null || v === '') return false;
    return true;
  }).length;

  return (
    <div className="col-span-full scroll-mt-4" ref={scrollRef}>
      <button
        type="button"
        onClick={onToggle}
        className="group mb-4.5 flex w-full items-center gap-2.5 pt-1.5"
      >
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${
            open ? '' : '-rotate-90'
          }`}
        />
        <span className="text-[11px] font-bold tracking-[0.1em] text-gray-400 uppercase transition-colors group-hover:text-gray-200">
          {label}
        </span>
        <div className="h-px flex-1 bg-linear-to-r from-white/8 to-transparent" />
        <span className="rounded-md border border-white/4 bg-white/5 px-2 py-0.5 text-[10px] text-gray-500 tabular-nums">
          {filledCount}/{fields.length}
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <SettingField
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(val) => onChange(field.key, val)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Global Search Results View ──────────────────────────────────────────────

function SearchResultsView({ query, values, onChange, disabled }) {
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches = [];

    SECTIONS.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.type === 'divider') return;

        const keyMatch = field.key?.toLowerCase().includes(q);
        const labelMatch = field.label?.toLowerCase().includes(q);
        const descMatch = field.desc?.toLowerCase().includes(q);
        const placeholderMatch = field.placeholder?.toLowerCase().includes(q);

        if (keyMatch || labelMatch || descMatch || placeholderMatch) {
          matches.push({
            field,
            section,
          });
        }
      });
    });

    return matches;
  }, [query]);

  // Group matched fields by section id
  const groupedResults = useMemo(() => {
    const groups = {};
    results.forEach((match) => {
      const secId = match.section.id;
      if (!groups[secId]) {
        groups[secId] = {
          section: match.section,
          fields: [],
        };
      }
      groups[secId].fields.push(match.field);
    });
    return Object.values(groups);
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="mb-3 h-10 w-10 animate-bounce text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-300">
          No settings matched your search
        </h3>
        <p className="mt-1 max-w-sm text-xs text-gray-500">
          Try typing a different key, label, description, or fallback value.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
          Search Results: {results.length} fields found
        </span>
      </div>

      {groupedResults.map((group) => {
        const SectionIcon = group.section.icon;
        return (
          <div
            key={group.section.id}
            className="rounded-2xl border border-white/6 bg-white/[0.01] p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-2 border-b border-white/4 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <SectionIcon className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-gray-200">
                {group.section.label}
              </span>
              <span className="text-[10px] text-gray-500">
                ({group.fields.length} matching)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <SettingField
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  onChange={(val) => onChange(field.key, val)}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section Content Panel ───────────────────────────────────────────────────

function SectionPanel({
  section,
  values,
  onChange,
  disabled,
  openGroups,
  setOpenGroups,
  search,
  setSearch,
}) {
  const groupRefs = useRef({});

  /* Parse field groups from dividers */
  const fieldGroups = useMemo(
    () => parseFieldGroups(section.fields),
    [section.fields]
  );

  /* Filter groups by search query */
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return fieldGroups;
    const q = search.toLowerCase();
    return fieldGroups
      .map((g) => ({
        ...g,
        fields: g.fields.filter(
          (f) =>
            f.label?.toLowerCase().includes(q) ||
            f.key?.toLowerCase().includes(q) ||
            f.desc?.toLowerCase().includes(q) ||
            f.placeholder?.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.fields.length > 0);
  }, [fieldGroups, search]);

  const totalFields = section.fields.filter((f) => f.type !== 'divider').length;
  const labeledGroups = fieldGroups.filter((g) => g.label);
  const isLarge = labeledGroups.length > 4;

  function toggleGroup(label) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function jumpToGroup(label) {
    setOpenGroups((prev) => new Set(prev).add(label));
    requestAnimationFrame(() => {
      groupRefs.current[label]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  const SectionIcon = section.icon;

  return (
    <div className="flex flex-col">
      {/* ── Section header ─────────────────────────────────────── */}
      <div className="mb-5.5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500/15 to-blue-500/5 ring-1 ring-blue-500/25">
            <SectionIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {section.label}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
              {section.description}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-lg border border-white/6 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-gray-500 tabular-nums">
          {totalFields} fields
        </span>
      </div>

      {/* ── Local Section Search (when fields > 8) ────────────── */}
      {totalFields > 8 && (
        <div className="relative mb-5">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search within ${section.label} (${totalFields} settings)...`}
            className="w-full rounded-xl border border-white/8 bg-white/3 py-2.5 pr-10 pl-10 text-xs text-gray-200 transition-all placeholder:text-gray-600 focus:border-white/15 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/15 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-md p-0.5 text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Table of contents (large sections) ─────────────────── */}
      {isLarge && !search.trim() && (
        <div className="mb-5 rounded-xl border border-white/6 bg-white/[0.01] p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase">
              Jump to Category
            </span>
            <button
              onClick={() =>
                setOpenGroups((prev) =>
                  prev.size === labeledGroups.length
                    ? new Set()
                    : new Set(labeledGroups.map((g) => g.label))
                )
              }
              className="text-[10px] font-semibold text-gray-500 transition-colors hover:text-gray-300"
            >
              {openGroups.size === labeledGroups.length
                ? 'Collapse all'
                : 'Expand all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {labeledGroups.map((g) => {
              const filled = g.fields.filter((f) => {
                const v = values[f.key];
                if (f.type === 'toggle') return !!v;
                return !(v === undefined || v === null || v === '');
              }).length;
              return (
                <button
                  key={g.label}
                  onClick={() => jumpToGroup(g.label)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/6 bg-white/3 px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 transition-all duration-150 hover:border-white/12 hover:bg-white/6 hover:text-gray-200 active:scale-[0.97]"
                >
                  {g.label}
                  <span className="text-[9px] text-gray-600 tabular-nums">
                    {filled}/{g.fields.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Field groups ───────────────────────────────────────── */}
      <div className="space-y-5">
        {filteredGroups.map((group, gi) => (
          <FieldGroup
            key={group.label ?? `group-${gi}`}
            label={group.label}
            fields={group.fields}
            values={values}
            onChange={onChange}
            disabled={disabled}
            open={!!search.trim() || openGroups.has(group.label)}
            onToggle={() => toggleGroup(group.label)}
            scrollRef={(el) => {
              if (group.label) groupRefs.current[group.label] = el;
            }}
          />
        ))}

        {filteredGroups.length === 0 && search && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="h-8 w-8 animate-bounce text-gray-700" />
            <p className="text-xs text-gray-500">
              No settings match &ldquo;{search}&rdquo; in this section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────


export { QuickTogglesWidget, SettingField, FieldGroup, SearchResultsView, SectionPanel };
