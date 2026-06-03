'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Trash2, Save, Loader2, CalendarDays, Clock, MapPin, FileText,
  Plus, Link, Users, Bell, RefreshCw, Eye, Video, ChevronDown,
} from 'lucide-react';
import { getTodayDateString } from './utils';

// ── Google Calendar colour palette ──────────────────────────────────────────
const GCal_COLORS = [
  { id: null,  name: 'Calendar default', hex: '#4285f4' },
  { id: '1',   name: 'Tomato',           hex: '#d50000' },
  { id: '2',   name: 'Flamingo',         hex: '#e67c73' },
  { id: '3',   name: 'Tangerine',        hex: '#f4511e' },
  { id: '4',   name: 'Banana',           hex: '#f6bf26' },
  { id: '5',   name: 'Sage',             hex: '#33b679' },
  { id: '6',   name: 'Basil',            hex: '#0b8043' },
  { id: '7',   name: 'Peacock',          hex: '#039be5' },
  { id: '8',   name: 'Blueberry',        hex: '#3f51b5' },
  { id: '9',   name: 'Lavender',         hex: '#7986cb' },
  { id: '10',  name: 'Grape',            hex: '#8e24aa' },
  { id: '11',  name: 'Graphite',         hex: '#616161' },
];

// ── Shared field components ──────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block font-black">{label}</label>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1 border-t border-white/5">
      <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-black">{label}</span>
    </div>
  );
}

// ── Personal Event Pane ──────────────────────────────────────────────────────

function PersonalEventPane({ item, mode, onClose, onSaved, onToast }) {
  const isCreate = mode === 'create';

  // Convert "02:30 PM" → "14:30"
  const to24 = (t) => {
    if (!t) return '';
    const [time, ap] = t.split(' ');
    if (!ap) return t; // already 24h
    let [h, m] = time.split(':').map(Number);
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const [title, setTitle] = useState(isCreate ? '' : item?.title || '');
  const [date, setDate] = useState(isCreate ? getTodayDateString() : (item?.dueDate || getTodayDateString()));
  const [endDate, setEndDate] = useState(isCreate ? '' : (item?.endDate || ''));
  const [startTime, setStartTime] = useState(isCreate ? '' : to24(item?.time || ''));
  const [endTime, setEndTime] = useState(isCreate ? '' : (item?.endTime || ''));
  const [description, setDescription] = useState(isCreate ? '' : (item?.description || ''));
  const [location, setLocation] = useState(isCreate ? '' : (item?.location || ''));
  const [url, setUrl] = useState(isCreate ? '' : (item?.url || ''));
  const [colorId, setColorId] = useState(isCreate ? null : (item?.colorId || null));
  const [status, setStatus] = useState(isCreate ? 'confirmed' : (item?.status || 'confirmed'));
  const [visibility, setVisibility] = useState(isCreate ? 'default' : (item?.visibility || 'default'));
  const [recurrence, setRecurrence] = useState(isCreate ? '' : (item?.recurrence || ''));
  const [reminders, setReminders] = useState(isCreate ? [] : (item?.reminders || []));
  const [attendees, setAttendees] = useState(isCreate ? [] : (item?.attendees || []));
  const [attendeeInput, setAttendeeInput] = useState('');
  const [busy, setBusy] = useState(false);

  const rawId = item?.personalEventId || null;
  const API = '/api/member/daily-activity/personal-events';

  const addAttendee = () => {
    const email = attendeeInput.trim();
    if (!email || attendees.some((a) => a.email === email)) return;
    setAttendees([...attendees, { email, name: '', optional: false }]);
    setAttendeeInput('');
  };

  const removeAttendee = (email) => setAttendees(attendees.filter((a) => a.email !== email));

  const addReminder = (method, minutes) => {
    if (reminders.some((r) => r.method === method && r.minutes === minutes)) return;
    setReminders([...reminders, { method, minutes }]);
  };

  const removeReminder = (i) => setReminders(reminders.filter((_, idx) => idx !== i));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const body = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      url: url.trim() || null,
      date,
      endDate: endDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      recurrence: recurrence.trim() || null,
      colorId: colorId || null,
      status,
      visibility,
      reminders,
      attendees,
    };
    const res = await fetch(API, {
      method: isCreate ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isCreate ? body : { id: rawId, ...body }),
    }).then((r) => r.json()).catch(() => ({ error: 'Network error' }));
    setBusy(false);
    if (res?.error) { onToast(res.error, 'error'); return; }
    onToast(isCreate ? 'Event created.' : 'Event updated.', 'success');
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;
    setBusy(true);
    const res = await fetch(`${API}?id=${rawId}`, { method: 'DELETE' })
      .then((r) => r.json()).catch(() => ({ error: 'Network error' }));
    setBusy(false);
    if (res?.error) { onToast(res.error, 'error'); return; }
    onToast('Event deleted.', 'info');
    onSaved();
    onClose();
  };

  const selectedColor = GCal_COLORS.find((c) => c.id === colorId) || GCal_COLORS[0];

  return (
    <form onSubmit={handleSave} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/2 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedColor.hex }} />
          <span className="text-[10px] font-black font-mono tracking-widest text-gray-400 uppercase">
            {isCreate ? 'New Event' : 'Edit Event'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {!isCreate && (
            <button type="button" onClick={handleDelete} disabled={busy}
              className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition cursor-pointer disabled:opacity-40">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={onClose}
            className="p-1.5 hover:bg-white/6 text-gray-400 rounded-lg transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Title */}
        <div className="space-y-1.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            required
            className="w-full p-3 bg-slate-950/40 border border-white/6 rounded-xl focus:outline-none focus:border-violet-500/60 text-white text-sm font-semibold placeholder:text-slate-600 transition"
          />
        </div>

        {/* Date & Time */}
        <SectionHeader icon={CalendarDays} label="Date & Time" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date *">
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white font-medium scheme-dark flex-1" />
            </div>
          </Field>
          <Field label="End Date">
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                min={date}
                className="bg-transparent border-none outline-none text-xs text-white font-medium scheme-dark flex-1" />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Time">
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white font-medium scheme-dark flex-1" />
            </div>
          </Field>
          <Field label="End Time">
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white font-medium scheme-dark flex-1" />
            </div>
          </Field>
        </div>

        {/* Recurrence */}
        <Field label="Recurrence (RRULE)">
          <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-white font-medium flex-1 cursor-pointer"
            >
              <option value="" className="bg-slate-900">Does not repeat</option>
              <option value="FREQ=DAILY" className="bg-slate-900">Daily</option>
              <option value="FREQ=WEEKLY" className="bg-slate-900">Weekly</option>
              <option value="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" className="bg-slate-900">Every weekday (Mon–Fri)</option>
              <option value="FREQ=MONTHLY" className="bg-slate-900">Monthly</option>
              <option value="FREQ=YEARLY" className="bg-slate-900">Annually</option>
            </select>
          </div>
        </Field>

        {/* Location & URL */}
        <SectionHeader icon={MapPin} label="Location & Link" />

        <Field label="Location">
          <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location or address"
              className="bg-transparent border-none outline-none text-xs text-white font-medium placeholder:text-slate-600 flex-1" />
          </div>
        </Field>

        <Field label="URL">
          <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
            <Link className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              className="bg-transparent border-none outline-none text-xs text-white font-medium placeholder:text-slate-600 flex-1" />
          </div>
        </Field>

        {/* Conference link (read-only, set by Google) */}
        {item?.conferenceLink && (
          <Field label="Google Meet">
            <a href={item.conferenceLink} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 hover:text-blue-200 transition truncate">
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.conferenceLink}</span>
            </a>
          </Field>
        )}

        {/* Description */}
        <SectionHeader icon={FileText} label="Description" />

        <div className="flex items-start gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description or notes"
            rows={3}
            className="bg-transparent border-none outline-none text-xs text-white font-medium placeholder:text-slate-600 flex-1 resize-none" />
        </div>

        {/* Guests */}
        <SectionHeader icon={Users} label="Guests" />

        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="email"
              value={attendeeInput}
              onChange={(e) => setAttendeeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttendee(); } }}
              placeholder="Add guest email"
              className="bg-transparent border-none outline-none text-xs text-white font-medium placeholder:text-slate-600 flex-1"
            />
          </div>
          <button type="button" onClick={addAttendee}
            className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {attendees.length > 0 && (
          <div className="space-y-1.5">
            {attendees.map((a) => (
              <div key={a.email} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900/50 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-300 shrink-0 uppercase">
                    {a.email[0]}
                  </div>
                  <span className="text-[10px] text-slate-300 truncate">{a.email}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAttendees(attendees.map((x) => x.email === a.email ? { ...x, optional: !x.optional } : x))}
                    className={`text-[8px] font-mono px-1.5 py-0.5 rounded border cursor-pointer transition ${a.optional ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-white/10 text-slate-500'}`}
                  >
                    optional
                  </button>
                  <button type="button" onClick={() => removeAttendee(a.email)}
                    className="text-slate-500 hover:text-rose-400 transition cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reminders */}
        <SectionHeader icon={Bell} label="Reminders" />

        <div className="flex flex-wrap gap-2">
          {[
            { label: '10 min', method: 'popup', minutes: 10 },
            { label: '30 min', method: 'popup', minutes: 30 },
            { label: '1 hr',  method: 'popup', minutes: 60 },
            { label: '1 day', method: 'popup', minutes: 1440 },
            { label: 'Email 1d', method: 'email', minutes: 1440 },
          ].map((preset) => {
            const active = reminders.some((r) => r.method === preset.method && r.minutes === preset.minutes);
            return (
              <button
                key={`${preset.method}-${preset.minutes}`}
                type="button"
                onClick={() => active ? removeReminder(reminders.findIndex((r) => r.method === preset.method && r.minutes === preset.minutes)) : addReminder(preset.method, preset.minutes)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black font-mono border transition cursor-pointer ${active ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-slate-900/40 border-white/8 text-slate-500 hover:text-slate-300'}`}
              >
                {active ? '✓ ' : ''}{preset.label}
              </button>
            );
          })}
        </div>

        {/* Colour & Status & Visibility */}
        <SectionHeader icon={Eye} label="Colour & Privacy" />

        {/* Colour picker */}
        <Field label="Colour">
          <div className="flex flex-wrap gap-2">
            {GCal_COLORS.map((c) => (
              <button
                key={c.id ?? 'default'}
                type="button"
                title={c.name}
                onClick={() => setColorId(c.id)}
                className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${colorId === c.id ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white font-medium flex-1 cursor-pointer">
                <option value="confirmed" className="bg-slate-900">Confirmed</option>
                <option value="tentative" className="bg-slate-900">Tentative</option>
              </select>
            </div>
          </Field>

          <Field label="Visibility">
            <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-white/6 rounded-xl">
              <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white font-medium flex-1 cursor-pointer">
                <option value="default" className="bg-slate-900">Default</option>
                <option value="public" className="bg-slate-900">Public</option>
                <option value="private" className="bg-slate-900">Private</option>
              </select>
            </div>
          </Field>
        </div>

      </div>

      {/* Footer */}
      <div className="shrink-0 px-5 py-4 border-t border-white/6 flex justify-end gap-2">
        <button type="button" onClick={onClose}
          className="px-4 py-2 text-[10px] font-black font-mono text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition">
          CANCEL
        </button>
        <button type="submit" disabled={busy}
          className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black font-mono tracking-wider transition flex items-center gap-1.5 disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {isCreate ? 'CREATE' : 'SAVE'}
        </button>
      </div>
    </form>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function GoogleItemPane({ item, mode = 'edit-personal', onClose, onSaved, onToast }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%', transition: { duration: 0.2 } }}
      className="w-full md:w-[440px] bg-gray-900 border-l border-white/8 h-full flex flex-col shadow-2xl z-40 fixed right-0 top-0 select-none"
    >
      <PersonalEventPane
        item={item}
        mode={mode === 'create-personal' ? 'create' : 'edit'}
        onClose={onClose}
        onSaved={onSaved}
        onToast={onToast}
      />
    </motion.div>
  );
}
