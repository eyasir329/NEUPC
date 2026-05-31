/**
 * @file Event sub editors component
 * @module EventSubEditors
 */

'use client';

import {
  Plus,
  Trash2,
  Clock,
  CalendarClock,
  Mic2,
  ChevronUp,
  ChevronDown,
  MapPin,
} from 'lucide-react';

// Shared Agenda + Speakers list editors used by the Create and Edit event forms.
// Both emit plain arrays matching what the event detail UI renders:
//   agenda item  → { id, time, title, description, speaker }
//   speaker item → { id, name, role, avatar }

const fieldCls =
  'w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-[13px] text-gray-100 placeholder-gray-700 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10';

function uid() {
  return `it_${Math.random().toString(36).slice(2, 10)}`;
}

function move(arr, from, to) {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function RowControls({ index, count, onUp, onDown, onRemove }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onUp}
        disabled={index === 0}
        className="rounded-md border border-white/10 bg-white/[0.02] p-1 text-gray-500 transition-colors hover:text-gray-200 disabled:opacity-30"
        aria-label="Move up"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={index === count - 1}
        className="rounded-md border border-white/10 bg-white/[0.02] p-1 text-gray-500 transition-colors hover:text-gray-200 disabled:opacity-30"
        aria-label="Move down"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md border border-red-500/20 bg-red-500/5 p-1 text-red-400 transition-colors hover:bg-red-500/15"
        aria-label="Remove"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AgendaEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];

  const update = (id, patch) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const add = () =>
    onChange([
      ...items,
      { id: uid(), time: '', title: '', description: '', speaker: '' },
    ]);
  const remove = (id) => onChange(items.filter((it) => it.id !== id));
  const reorder = (i, dir) => onChange(move(items, i, i + dir));

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-8 text-center">
          <CalendarClock className="h-6 w-6 text-gray-600" />
          <p className="text-[12px] text-gray-500">
            No agenda items yet. Add timeline entries shown under “Event
            Agenda”.
          </p>
        </div>
      ) : (
        items.map((it, i) => (
          <div
            key={it.id}
            className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5"
          >
            <div className="flex items-start gap-3">
              <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-[140px_1fr]">
                <div className="relative">
                  <Clock className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
                  <input
                    value={it.time}
                    onChange={(e) => update(it.id, { time: e.target.value })}
                    placeholder="09:00 AM"
                    className={`${fieldCls} pl-8 font-mono`}
                  />
                </div>
                <input
                  value={it.title}
                  onChange={(e) => update(it.id, { title: e.target.value })}
                  placeholder="Session title"
                  className={fieldCls}
                />
              </div>
              <RowControls
                index={i}
                count={items.length}
                onUp={() => reorder(i, -1)}
                onDown={() => reorder(i, 1)}
                onRemove={() => remove(it.id)}
              />
            </div>
            <textarea
              value={it.description}
              onChange={(e) => update(it.id, { description: e.target.value })}
              rows={2}
              placeholder="Short description (optional)"
              className={`${fieldCls} resize-none leading-relaxed`}
            />
            <input
              value={it.speaker}
              onChange={(e) => update(it.id, { speaker: e.target.value })}
              placeholder="Speaker / host (optional)"
              className={fieldCls}
            />
          </div>
        ))
      )}

      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 py-2.5 text-[12px] font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/10"
      >
        <Plus className="h-3.5 w-3.5" /> Add Agenda Item
      </button>
    </div>
  );
}

export function SpeakersEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];

  const update = (id, patch) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const add = () =>
    onChange([...items, { id: uid(), name: '', role: '', avatar: '' }]);
  const remove = (id) => onChange(items.filter((it) => it.id !== id));
  const reorder = (i, dir) => onChange(move(items, i, i + dir));

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-8 text-center">
          <Mic2 className="h-6 w-6 text-gray-600" />
          <p className="text-[12px] text-gray-500">
            No speakers yet. Add presenters shown under “Panel Speakers”.
          </p>
        </div>
      ) : (
        items.map((it, i) => (
          <div
            key={it.id}
            className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5"
          >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
              {it.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  referrerPolicy="no-referrer"
                  src={it.avatar}
                  alt={it.name || 'Speaker'}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Mic2 className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
            <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                value={it.name}
                onChange={(e) => update(it.id, { name: e.target.value })}
                placeholder="Speaker name"
                className={fieldCls}
              />
              <input
                value={it.role}
                onChange={(e) => update(it.id, { role: e.target.value })}
                placeholder="Role / title"
                className={fieldCls}
              />
              <input
                value={it.avatar}
                onChange={(e) => update(it.id, { avatar: e.target.value })}
                placeholder="Avatar image URL (optional)"
                className={`${fieldCls} font-mono text-[12px] sm:col-span-2`}
              />
            </div>
            <RowControls
              index={i}
              count={items.length}
              onUp={() => reorder(i, -1)}
              onDown={() => reorder(i, 1)}
              onRemove={() => remove(it.id)}
            />
          </div>
        ))
      )}

      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 py-2.5 text-[12px] font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/10"
      >
        <Plus className="h-3.5 w-3.5" /> Add Speaker
      </button>
    </div>
  );
}

export function TimelineEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];

  const update = (id, patch) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const add = () =>
    onChange([
      ...items,
      { id: uid(), title: '', start_date: '', end_date: '', location: '' },
    ]);
  const remove = (id) => onChange(items.filter((it) => it.id !== id));
  const reorder = (i, dir) => onChange(move(items, i, i + dir));

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-8 text-center">
          <CalendarClock className="h-6 w-6 text-gray-600" />
          <p className="text-[12px] text-gray-500">
            No timeline sessions scheduled yet. Add multiple timelines to this event.
          </p>
        </div>
      ) : (
        items.map((it, i) => (
          <div
            key={it.id}
            className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5"
          >
            <div className="flex items-start gap-3">
              <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10.5px] font-bold tracking-wider text-gray-500 uppercase">
                    Session Title
                  </label>
                  <input
                    value={it.title}
                    onChange={(e) => update(it.id, { title: e.target.value })}
                    placeholder="e.g. Day 1: Keynote & Kickoff"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10.5px] font-bold tracking-wider text-gray-500 uppercase">
                    Specific Venue / Location
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
                    <input
                      value={it.location}
                      onChange={(e) => update(it.id, { location: e.target.value })}
                      placeholder="e.g. Room 201 (optional)"
                      className={`${fieldCls} pl-8`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10.5px] font-bold tracking-wider text-gray-500 uppercase">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={it.start_date}
                    onChange={(e) => update(it.id, { start_date: e.target.value })}
                    className={`${fieldCls} [color-scheme:dark]`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10.5px] font-bold tracking-wider text-gray-500 uppercase">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={it.end_date}
                    onChange={(e) => update(it.id, { end_date: e.target.value })}
                    className={`${fieldCls} [color-scheme:dark]`}
                  />
                </div>
              </div>
              <RowControls
                index={i}
                count={items.length}
                onUp={() => reorder(i, -1)}
                onDown={() => reorder(i, 1)}
                onRemove={() => remove(it.id)}
              />
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 py-2.5 text-[12px] font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/10"
      >
        <Plus className="h-3.5 w-3.5" /> Add Timeline Session
      </button>
    </div>
  );
}

