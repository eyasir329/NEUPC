'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import {
  ChevronLeft, Save, Trash2, Users, Tag, Globe,
  FileText, Calendar, MapPin, Star, AlertTriangle, Loader2,
  CheckCircle2, Settings, Image as ImageIcon, Edit3, Eye,
  Shield, Hash, Info, X, UploadCloud,
  ArrowLeft, ExternalLink, Mic2, CalendarClock,
} from 'lucide-react';
import { EVENT_STATUS_CONFIG, CATEGORIES, VENUE_TYPES } from './eventConstants';
import { driveImageUrl } from '@/app/_lib/utils';
import MultiBlockEditor from '@/app/account/admin/bootcamps/_components/MultiBlockEditor';
import { AgendaEditor, SpeakersEditor } from './EventSubEditors';
import EventPublicContent from './EventPublicContent';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');

const fmtDateLong = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

function deriveStatus(event) {
  if (event._bucket === 'ongoing' || event.status === 'ongoing')
    return { label: '● Session Live', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/25', matrix: 'text-rose-400', plain: 'Live' };
  if (event.status === 'upcoming' || event._bucket === 'upcoming')
    return { label: 'Upcoming', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25', matrix: 'text-gray-200', plain: 'Upcoming' };
  if (event.status === 'completed' || event._bucket === 'completed')
    return { label: 'Completed', badge: 'bg-white/[0.06] text-gray-300 border-white/[0.1]', matrix: 'text-gray-200', plain: 'Completed' };
  if (event.status === 'cancelled')
    return { label: 'Cancelled', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/25', matrix: 'text-rose-400', plain: 'Cancelled' };
  return { label: 'Draft', badge: 'bg-white/[0.06] text-gray-400 border-white/[0.1]', matrix: 'text-gray-300', plain: 'Draft' };
}

// ─── Field primitives ──────────────────────────────────────────────────────────

function Label({ children, required, hint }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {children}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {hint && (
        <span className="flex items-center gap-1 text-[10px] text-gray-600">
          <Info className="h-3 w-3" />{hint}
        </span>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-white/6 bg-white/2 px-4 py-3 text-[13px] text-gray-100 placeholder-gray-700 outline-none ring-0 transition-all focus:border-indigo-500/50 focus:bg-white/4 focus:ring-4 focus:ring-indigo-500/10 [color-scheme:dark]';
const textareaCls = `${inputCls} resize-none leading-relaxed`;

// ─── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, description }) {
  return (
    <label className="group flex cursor-pointer items-center gap-4 rounded-xl border border-white/6 bg-white/[0.01] px-4 py-3.5 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.03]">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-gray-200 group-hover:text-white transition-colors">{label}</p>
        {description && <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">{description}</p>}
      </div>
      <div className="relative shrink-0">
        <input type="checkbox" className="sr-only" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <div className={`h-6 w-11 rounded-full transition-all duration-200 ${value ? 'bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'bg-white/10'}`} />
        <div className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${value ? 'translate-x-5' : ''}`} />
      </div>
    </label>
  );
}

// ─── Section card ──────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, description, accentColor = '#818cf8', children, dangerous = false }) {
  return (
    <div className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
      dangerous
        ? 'border-red-500/20 bg-gradient-to-b from-red-950/10 to-transparent hover:border-red-500/30'
        : 'border-white/6 bg-gradient-to-b from-white/[0.02] to-transparent hover:border-white/12'
    }`}>
      {/* Section header */}
      <div className={`flex items-center gap-3.5 px-5 py-4 ${
        dangerous
          ? 'border-b border-red-500/10 bg-red-500/[0.02]'
          : 'border-b border-white/[0.04] bg-white/[0.01]'
      }`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
          dangerous ? 'border-red-500/20 bg-red-500/5' : 'border-white/8 bg-white/[0.02]'
        }`}
          style={!dangerous ? { boxShadow: `0 0 0 1px ${accentColor}10, inset 0 1px 0 ${accentColor}08` } : {}}>
          <Icon className={`h-[17px] w-[17px] transition-transform duration-300 group-hover:scale-105 ${dangerous ? 'text-red-400' : ''}`}
            style={!dangerous ? { color: accentColor } : {}} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[12px] font-extrabold uppercase tracking-wider tracking-tight ${dangerous ? 'text-red-300' : 'text-gray-200'}`}>{title}</p>
          {description && <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">{description}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-5 p-5">{children}</div>
    </div>
  );
}

// ─── Pill button (category / venue) ───────────────────────────────────────────

function Pill({ active, onClick, children, activeClass = 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]' }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-150 ${
        active ? activeClass : 'border-white/6 bg-white/2 text-gray-500 hover:border-white/15 hover:text-gray-300'
      }`}>
      {children}
    </button>
  );
}

// ─── Segmented control ─────────────────────────────────────────────────────────

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-white/6 bg-white/2 p-1 gap-0.5">
      {options.map((opt) => (
        <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-150 ${
            value === opt.id
              ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
              : 'text-gray-500 hover:text-gray-300'
          }`}>
          {opt.emoji && <span>{opt.emoji}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Card select (participation type / eligibility) ───────────────────────────

function CardSelect({ options, value, onChange, cols = 2 }) {
  const colClass = cols === 3 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`grid gap-2.5 ${colClass}`}>
      {options.map((opt) => (
        <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
          className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-150 ${
            value === opt.id
              ? 'border-indigo-500/40 bg-indigo-500/[0.04] ring-1 ring-indigo-500/10 shadow-sm'
              : 'border-white/6 bg-white/[0.01] hover:border-white/14 hover:bg-white/[0.03]'
          }`}>
          <span className="mt-0.5 text-lg leading-none">{opt.icon}</span>
          <div className="min-w-0">
            <p className={`text-[12px] font-extrabold uppercase tracking-wider leading-tight ${value === opt.id ? 'text-indigo-200' : 'text-gray-300'}`}>{opt.label}</p>
            {opt.desc && <p className={`mt-1.5 text-[11px] leading-snug ${value === opt.id ? 'text-indigo-400/80' : 'text-gray-500'}`}>{opt.desc}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── AI Write button ───────────────────────────────────────────────────────────

// ─── Upload image field ────────────────────────────────────────────────────────

function UploadImageField({ label, value, onChange, onClear, hint, aspectClass = 'aspect-video', badge, uploadAction }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setUploadError('Use JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Max 10 MB.');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await uploadAction(fd);
      if (res?.error) setUploadError(res.error);
      else onChange(res.url);
    } catch {
      setUploadError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }, [uploadAction, onChange]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col gap-2">
      <Label hint={hint}>{label}</Label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-all duration-200 ${
          dragging
            ? 'border-indigo-500/70 bg-indigo-500/8 scale-[1.01]'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploading ? (
          <>
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            <p className="text-[12px] font-semibold text-gray-400">Uploading to Drive…</p>
          </>
        ) : (
          <>
            <UploadCloud className={`h-7 w-7 transition-colors ${dragging ? 'text-indigo-400' : 'text-gray-600'}`} />
            <div className="text-center">
              <p className={`text-[12px] font-semibold transition-colors ${dragging ? 'text-indigo-300' : 'text-gray-400'}`}>
                {dragging ? 'Drop to upload' : 'Click or drag & drop'}
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5">JPEG, PNG, WebP, GIF · max 10 MB</p>
            </div>
          </>
        )}
      </div>

      {/* URL input + AI generate row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={value}
            onChange={(e) => { setUploadError(null); onChange(e.target.value); }}
            placeholder="or paste image URL…"
            className={`${inputCls} pr-20`}
          />
          {value && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-bold text-green-400">✓</span>
              <button type="button" onClick={() => { onClear ? onClear() : onChange(''); }}
                className="rounded p-0.5 text-gray-600 hover:text-red-400 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertTriangle className="h-3 w-3 shrink-0" /> {uploadError}
        </p>
      )}

      {/* Preview */}
      {value && (
        <div className={`group relative overflow-hidden rounded-xl border border-white/8 bg-gray-800 ${aspectClass}`}>
          <img src={driveImageUrl(value)} alt={label}
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
            className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-xl" />
          {badge && (
            <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {badge}
            </span>
          )}
          <button type="button" onClick={() => { onClear ? onClear() : onChange(''); }}
            className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-gray-300 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:text-red-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Live preview ──────────────────────────────────────────────────────────────

function LivePreview({ title, description, coverImage, category, status, startDate, endDate, location, venueType, participationType, tags, isFeatured }) {
  const sc = EVENT_STATUS_CONFIG[status?.toLowerCase()] || EVENT_STATUS_CONFIG.draft;
  const VENUE_EMOJI = { offline: '📍', online: '🌐', hybrid: '🔀' };

  const fmtDT = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return null; }
  };

  const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-950 shadow-2xl shadow-black/40">
      {/* Cover */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        {coverImage ? (
          <img src={driveImageUrl(coverImage)} alt="Preview"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="h-full w-full object-cover opacity-70" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <ImageIcon className="h-8 w-8 text-gray-700" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-700">No Cover Image</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
        {/* Badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${sc.badge}`}>
            {sc.label}
          </span>
          {category && (
            <span className="rounded-full border border-violet-500/40 bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300 backdrop-blur-sm">
              {category}
            </span>
          )}
          {isFeatured && (
            <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5" /> Featured
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-3 text-[15px] font-bold leading-snug tracking-tight text-white">
          {title || <span className="text-gray-600 italic">Untitled Event</span>}
        </h3>

        <div className="mb-4 flex flex-col divide-y divide-white/[0.05]">
          {fmtDT(startDate) && (
            <div className="flex items-center gap-2.5 py-2 text-[11.5px]">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-600" />
              <span className="font-semibold text-gray-300">{fmtDT(startDate)}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2.5 py-2 text-[11.5px]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-600" />
              <span className="truncate font-semibold text-gray-300">{location}</span>
            </div>
          )}
          {(venueType || participationType) && (
            <div className="flex items-center gap-2.5 py-2 text-[11.5px]">
              <Users className="h-3.5 w-3.5 shrink-0 text-gray-600" />
              <span className="font-semibold text-gray-400">
                {VENUE_EMOJI[venueType] || ''} {venueType ? venueType.charAt(0).toUpperCase() + venueType.slice(1) : ''}{participationType ? ` · ${participationType.charAt(0).toUpperCase() + participationType.slice(1)}` : ''}
              </span>
            </div>
          )}
        </div>

        {description && (
          <p className="mb-3 line-clamp-3 text-[12px] leading-relaxed text-gray-500">{description}</p>
        )}

        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tagList.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[10px] text-gray-500">#{tag}</span>
            ))}
            {tagList.length > 4 && (
              <span className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[10px] text-gray-600">+{tagList.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Edit form ─────────────────────────────────────────────────────────────────

function EditForm({ event, allCategories = [], roles = [], onSave, onCancel, onDelete, saveAction, deleteAction, uploadImageAction, deleteImageAction }) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState(event.title ?? '');
  const [slug, setSlug] = useState(event.slug ?? '');
  const [description, setDescription] = useState(event.description ?? '');
  const [content, setContent] = useState(event.content ?? '');
  const [location, setLocation] = useState(event.location ?? '');
  const [venueType, setVenueType] = useState(event.venue_type ?? 'offline');
  const [category, setCategory] = useState(event.category ?? '');
  const [customCategory, setCustomCategory] = useState(
    event.category && !CATEGORIES.includes(event.category) ? event.category : ''
  );
  const [status, setStatus] = useState(event.status ?? 'draft');
  const [startDate, setStartDate] = useState(toInput(event.start_date));
  const [endDate, setEndDate] = useState(toInput(event.end_date));
  const [coverImage, setCoverImage] = useState(event.cover_image ?? '');
  const [regRequired, setRegRequired] = useState(event.registration_required ?? false);
  const [regDeadline, setRegDeadline] = useState(toInput(event.registration_deadline));
  const [maxParticipants, setMaxParticipants] = useState(event.max_participants ?? '');
  const [isFeatured, setIsFeatured] = useState(event.is_featured ?? false);
  const [tags, setTags] = useState(event.tags?.join(', ') ?? '');
  const [prerequisites, setPrerequisites] = useState(event.prerequisites ?? '');
  const [eligibility, setEligibility] = useState(event.eligibility ?? 'all');
  const [participationType, setParticipationType] = useState(event.participation_type ?? 'individual');
  const [teamSize, setTeamSize] = useState(event.team_size ?? '');
  const [agenda, setAgenda] = useState(Array.isArray(event.agenda) ? event.agenda : []);
  const [speakers, setSpeakers] = useState(Array.isArray(event.speakers) ? event.speakers : []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('id', event.id);
    fd.set('title', title);
    if (slug.trim()) fd.set('slug', slug.trim());
    fd.set('description', description);
    fd.set('content', content);
    fd.set('location', location);
    fd.set('venue_type', venueType);
    fd.set('category', category);
    fd.set('status', status);
    fd.set('start_date', startDate);
    if (endDate) fd.set('end_date', endDate);
    fd.set('cover_image', coverImage);
    if (regRequired) fd.set('registration_required', 'true');
    if (regDeadline) fd.set('registration_deadline', regDeadline);
    if (maxParticipants) fd.set('max_participants', maxParticipants);
    if (isFeatured) fd.set('is_featured', 'true');
    fd.set('tags', tags);
    fd.set('prerequisites', prerequisites);
    fd.set('eligibility', eligibility);
    fd.set('participation_type', participationType);
    if (participationType === 'team' && teamSize) fd.set('team_size', teamSize);
    fd.set('agenda', JSON.stringify(agenda));
    fd.set('speakers', JSON.stringify(speakers));
    startTransition(async () => {
      const res = await saveAction(fd);
      if (res?.error) return setError(res.error);
      onSave();
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set('id', event.id);
      const res = await deleteAction(fd);
      if (res?.error) return setError(res.error);
      onDelete();
    });
  };

  const VENUE_OPTS = [
    { id: 'offline', label: 'Offline', emoji: '📍' },
    { id: 'online',  label: 'Online',  emoji: '🌐' },
    { id: 'hybrid',  label: 'Hybrid',  emoji: '🔀' },
  ];

  const PARTICIPATION_OPTS = [
    { id: 'individual', icon: '👤', label: 'Individual', desc: 'Solo attendees register for themselves' },
    { id: 'team',       icon: '👥', label: 'Team',       desc: 'Group-based, squad registration' },
  ];

  const ELIGIBILITY_OPTS = roles.length > 0
    ? [
        { id: 'all', icon: '🌍', label: 'Everyone', desc: 'Open to all' },
        ...roles.map((r) => ({
          id: r.id,
          icon: r.name === 'member' ? '🎓' : r.name === 'executive' ? '⭐' : '👥',
          label: `${r.name.charAt(0).toUpperCase() + r.name.slice(1)}s Only`,
          desc: `Open to ${r.name}s`,
        }))
      ]
    : [
        { id: 'all',       icon: '🌍', label: 'Everyone',        desc: 'Open to all' },
        { id: 'member',    icon: '🎓', label: 'Members Only',    desc: 'Club members' },
        { id: 'executive', icon: '⭐', label: 'Executives Only', desc: 'Exec committee' },
      ];

  const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">

      {/* ── Left col: sticky live preview ── */}
      <div className="xl:col-span-4 xl:sticky xl:top-[72px]">
        <div className="mb-3 flex items-center gap-2 px-1">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">Live Preview</p>
        </div>
        <LivePreview
          title={title} description={description} coverImage={coverImage}
          category={category} status={status} startDate={startDate}
          endDate={endDate} location={location} venueType={venueType}
          participationType={participationType} tags={tags} isFeatured={isFeatured}
        />

        {/* Field completion checklist */}
        <div className="mt-4 rounded-xl border border-white/6 bg-white/[0.02] p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-600">Checklist</p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Title',       done: !!title },
              { label: 'Description', done: !!description },
              { label: 'Start date',  done: !!startDate },
              { label: 'Location',    done: !!location },
              { label: 'Category',    done: !!category },
              { label: 'Cover image', done: !!coverImage },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${done ? 'border-emerald-500/50 bg-emerald-500/15' : 'border-white/10 bg-white/3'}`}>
                  {done && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </div>
                <span className={`text-[12px] font-medium transition-colors ${done ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right col: form ── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 xl:col-span-8 pb-20">

        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-30 overflow-hidden rounded-2xl border border-white/10 bg-gray-950/80 shadow-xl shadow-black/40 backdrop-blur-xl">
          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold leading-tight text-gray-100">{title || 'Untitled Event'}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-gray-500">Editing · Changes not saved</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={onCancel}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-[12px] font-bold text-gray-400 transition-all hover:border-white/20 hover:bg-white/5 hover:text-gray-200 active:scale-95">
                Discard
              </button>
              <button type="submit" disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50">
                {isPending
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                  : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-[2px] w-full bg-white/5">
            <div className="h-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 transition-all duration-300"
              style={{ width: `${Math.round(([title, description, startDate, location, category, coverImage].filter(Boolean).length / 6) * 100)}%` }} />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* ── 1. Basic Information ── */}
        <Section icon={FileText} title="Basic Information" description="Event title, short summary, and full schedule content" accentColor="#a78bfa">
          <div>
            <Label required>Event Title</Label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="e.g. ICPC Regional Qualifying Round 2025"
              className={inputCls} />
          </div>
          <div>
            <Label hint="URL identifier — must be unique">Slug</Label>
            <div className="flex gap-2">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                placeholder="auto-generated-from-title"
                className={`${inputCls} flex-1 font-mono text-[12px]`}
              />
              <button
                type="button"
                onClick={() => {
                  if (!title.trim()) return;
                  const base = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 60);
                  setSlug(`${base}-${Date.now().toString(36)}`);
                }}
                className="shrink-0 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
              >
                Generate
              </button>
            </div>
            {slug && (
              <p className="mt-1 text-[10px] text-gray-600">/events/<span className="text-gray-500">{slug}</span></p>
            )}
          </div>
          <div>
            <Label hint="Shown on cards & listings">Short Description</Label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="A compelling one-paragraph summary that draws attendees in…"
              className={textareaCls} />
            <div className="mt-1.5 flex justify-end">
              <span className={`text-[10px] font-medium tabular-nums ${description.length > 200 ? 'text-amber-400' : 'text-gray-700'}`}>
                {description.length} chars
              </span>
            </div>
          </div>
          <div>
            <Label hint="Shown on event detail page">Full Content / Schedule</Label>
            <MultiBlockEditor
              value={content}
              onChange={setContent}
              uploadImageAction={uploadImageAction}
            />
          </div>
        </Section>

        {/* ── 1b. Agenda ── */}
        <Section icon={CalendarClock} title="Agenda / Schedule" description="Chronology timeline shown under the “Event Agenda” tab" accentColor="#818cf8">
          <AgendaEditor value={agenda} onChange={setAgenda} />
        </Section>

        {/* ── 1c. Speakers ── */}
        <Section icon={Mic2} title="Panel Speakers" description="Presenters shown under the “Panel Speakers” tab" accentColor="#34d399">
          <SpeakersEditor value={speakers} onChange={setSpeakers} />
        </Section>

        {/* ── 2. Media Assets ── */}
        <Section icon={ImageIcon} title="Media Assets" description="Upload or link images for event cards and the detail page header" accentColor="#22d3ee">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <UploadImageField
              label="Cover Image"
              value={coverImage}
              onChange={setCoverImage}
              onClear={() => { if (deleteImageAction && coverImage) deleteImageAction(coverImage).catch(() => {}); setCoverImage(''); }}
              hint="Thumbnail on listings"
              aspectClass="aspect-video"
              badge="Thumbnail"
              uploadAction={uploadImageAction}
            />
          </div>
        </Section>

        {/* ── 3. Classification & Status ── */}
        <Section icon={Tag} title="Classification & Status" description="How the event is categorised and whether it is published" accentColor="#fbbf24">
          <div>
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {[...new Set([...CATEGORIES, ...allCategories])].map((c) => (
                <Pill key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Pill>
              ))}
              {/* Custom category input */}
              {customCategory && ![...CATEGORIES, ...allCategories].includes(customCategory) && (
                <Pill active={category === customCategory} onClick={() => setCategory(customCategory)}>
                  {customCategory}
                </Pill>
              )}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); if (customCategory.trim()) setCategory(customCategory.trim()); }
                  }}
                  placeholder="Custom…"
                  className="h-[36px] w-28 rounded-full border border-dashed border-white/20 bg-white/2 px-4 text-[11px] font-semibold text-gray-300 placeholder-gray-600 outline-none focus:border-indigo-500/40 focus:bg-white/4 focus:text-gray-200 transition-colors"
                />
                {customCategory.trim() && (
                  <button type="button" onClick={() => setCategory(customCategory.trim())}
                    className="h-[36px] rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 text-[11px] font-bold uppercase tracking-wider text-indigo-300 hover:bg-indigo-500/20 transition-colors">
                    + Add
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <Label>Publication Status</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(EVENT_STATUS_CONFIG).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setStatus(k)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-150 ${
                    status === k ? v.badge : 'border-white/8 bg-white/[0.03] text-gray-500 hover:border-white/14 hover:text-gray-300'
                  }`}>
                  <span className={`h-2 w-2 rounded-full ${v.dot} ${status === k ? 'animate-pulse' : ''}`} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 4. Time & Location ── */}
        <Section icon={Calendar} title="Time & Location" description="When and where the event takes place" accentColor="#34d399">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label required>Start Date & Time</Label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} className={inputCls} />
            </div>
          </div>
          <div>
            <Label>Venue Type</Label>
            <SegmentedControl options={VENUE_OPTS} value={venueType} onChange={setVenueType} />
          </div>
          <div>
            <Label required hint="Hidden from non-registered users if reg. required">Location</Label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} required
              placeholder="e.g. CSE Auditorium, Room 301, or Zoom Meeting Link"
              className={inputCls} />
          </div>
        </Section>

        {/* ── 5. Registration Setup ── */}
        <Section icon={Settings} title="Registration Setup" description="Configure registration requirements, capacity, and deadlines" accentColor="#60a5fa">
          <Toggle value={regRequired} onChange={setRegRequired}
            label="Registration Required"
            description="Attendees must register or obtain a ticket before joining." />

          <div className={`flex flex-col gap-5 transition-all duration-200 ${!regRequired ? 'pointer-events-none opacity-40 select-none' : ''}`}>
            <div>
              <Label>Participation Type</Label>
              <CardSelect options={PARTICIPATION_OPTS} value={participationType} onChange={setParticipationType} cols={2} />
            </div>

            {participationType === 'team' && (
              <div>
                <Label hint="Members required per team">Team Size</Label>
                <input type="number" min="2" max="20" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}
                  placeholder="e.g. 3" className={`${inputCls} max-w-[160px]`} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label hint="Closes before event start">Registration Deadline</Label>
                <input type="datetime-local" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)}
                  max={startDate || undefined} className={inputCls} />
              </div>
              <div>
                <Label hint="Leave blank for unlimited">Max Participants</Label>
                <input type="number" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="Unlimited" className={inputCls} />
              </div>
            </div>

          </div>
        </Section>

        {/* ── 6. Audience & Eligibility ── */}
        <Section icon={Shield} title="Audience & Eligibility" description="Define who can participate and any prerequisites" accentColor="#f87171">
          <div>
            <Label>Who Can Participate</Label>
            <CardSelect options={ELIGIBILITY_OPTS} value={eligibility} onChange={setEligibility} cols={3} />
          </div>
          <div>
            <Label hint="Optional">Requirements / Prerequisites</Label>
            <textarea value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} rows={3}
              placeholder="e.g. Basic knowledge of C/C++, Codeforces rating ≥ 1200, prior contest experience…"
              className={textareaCls} />
          </div>
        </Section>

        {/* ── 7. Discovery & Links ── */}
        <Section icon={Globe} title="Discovery & Links" description="Featured status, external website, and searchable tags" accentColor="#fb923c">
          <Toggle value={isFeatured} onChange={setIsFeatured}
            label="Feature on Homepage"
            description="Pin this event to the hero section and public homepage." />

          <div>
            <Label hint="Comma-separated">
              <Hash className="h-3 w-3 mr-1 inline" />Tags
            </Label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="icpc, programming, algorithms, team (comma-separated)"
              className={inputCls} />
            {tagList.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {tagList.map((tag) => (
                  <span key={tag} className="rounded-full border border-indigo-500/20 bg-indigo-500/8 px-2.5 py-0.5 text-[11px] font-medium text-indigo-400">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* ── 8. Danger Zone ── */}
        <Section icon={Trash2} title="Danger Zone" dangerous>
          {confirmDelete ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-[12px] leading-relaxed text-gray-400">
                  This will <strong className="text-red-300">permanently delete</strong> this event and <strong className="text-red-300">all its registrations</strong>. There is no going back.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-[12px] font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-gray-200">
                  Cancel
                </button>
                <button type="button" onClick={handleDelete} disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-[12px] font-bold text-white transition-all hover:bg-red-500 disabled:opacity-60 active:scale-95">
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {isDeleting ? 'Deleting…' : 'Yes, Delete Event'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] leading-relaxed text-gray-500">
                Permanently delete this event and wipe all registration records. This cannot be undone.
              </p>
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-5 py-2.5 text-[12px] font-bold text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 sm:w-auto w-full">
                <Trash2 className="h-4 w-4" /> Delete Event
              </button>
            </div>
          )}
        </Section>
      </form>
    </div>
  );
}

// ─── View sidebar ──────────────────────────────────────────────────────────────

function RegistrationStatsWidget({ event, onViewRegs }) {
  const full =
    event.max_participants && (event.registrationCount ?? 0) >= event.max_participants;
  const checkedIn = event.attendedCount ?? 0;
  return (
    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-gray-900 p-5 text-left">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-bold tracking-wider text-gray-500 uppercase">
          Logistics Analytics
        </h4>
        {onViewRegs ? (
          <button
            onClick={onViewRegs}
            className="font-mono text-[10px] font-bold text-indigo-400 uppercase transition-colors hover:text-indigo-300"
          >
            View all →
          </button>
        ) : (
          <span className="font-mono text-[9px] font-semibold text-gray-500 uppercase">
            Live Pulse
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
          <span className="font-mono text-[9px] font-bold tracking-wider text-gray-500 uppercase">
            Registered
          </span>
          <p className="mt-1 text-2xl leading-none font-bold text-white">
            {event.registrationCount ?? 0}
          </p>
          <span className="mt-1.5 block font-mono text-[8px] font-semibold text-emerald-400">
            Active attendees
          </span>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
          <span className="font-mono text-[9px] font-bold tracking-wider text-gray-500 uppercase">
            Checked In
          </span>
          <p className="mt-1 text-2xl leading-none font-bold text-white">
            {checkedIn}
          </p>
          <span className="mt-1.5 block font-mono text-[8px] font-semibold text-gray-500">
            Live occupancy
          </span>
        </div>
      </div>

      {event.max_participants && (
        <div>
          <div className="mb-2 flex justify-between font-mono text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            <span>Capacity</span>
            <span className={full ? 'font-semibold text-rose-400' : 'text-gray-400'}>
              {event.registrationCount ?? 0} / {event.max_participants}
              {full && ' · Full'}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${full ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
              style={{ width: `${Math.min(100, ((event.registrationCount ?? 0) / event.max_participants) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EventDetailsWidget({ event, roles = [] }) {
  const sc = deriveStatus(event);

  const eligibilityValue = (() => {
    if (!event.eligibility || event.eligibility === 'all') return 'Everyone';
    if (event.eligibility === 'member') return 'Members Only';
    if (event.eligibility === 'executive') return 'Executives Only';
    const role = roles.find((r) => r.id === event.eligibility);
    if (role) return `${role.name.charAt(0).toUpperCase() + role.name.slice(1)}s Only`;
    return event.eligibility;
  })();

  const startDateLong = fmtDateLong(event.start_date);
  const endDateLong = event.end_date ? fmtDateLong(event.end_date) : startDateLong;
  const startTime = fmtTime(event.start_date);
  const endTime = event.end_date ? fmtTime(event.end_date) : '';
  const venueType = event.venue_type
    ? event.venue_type.charAt(0).toUpperCase() + event.venue_type.slice(1)
    : '—';

  const rows = [
    { label: 'Stream Status', value: sc.plain, className: `font-mono font-bold text-[11px] ${sc.matrix}` },
    { label: 'Category Topic', value: event.category || '—', className: 'text-gray-200 font-semibold text-right max-w-[130px] truncate' },
    { label: 'Venue Layout', value: venueType, className: 'text-white font-bold' },
    { label: 'Participation', value: event.participation_type === 'team' ? `Team · ${event.team_size ?? '?'}` : 'Individual', className: 'text-gray-200 font-semibold' },
    { label: 'Start Bracket', value: `${startDateLong}${startTime ? `, ${startTime}` : ''}`, className: 'text-gray-300 font-mono font-semibold text-right', stack: true },
    { label: 'End Bracket', value: `${endDateLong}${endTime ? `, ${endTime}` : ''}`, className: 'text-gray-300 font-mono font-semibold text-right', stack: true },
    { label: 'Location', value: event.location || '—', className: 'text-gray-200 font-semibold text-right max-w-[150px] truncate' },
    { label: 'Eligibility Target', value: eligibilityValue, className: 'text-indigo-400 font-bold text-right max-w-[140px] truncate' },
    ...(event.prerequisites ? [{ label: 'Prerequisites', value: event.prerequisites, className: 'text-gray-300 font-semibold text-right max-w-[150px] truncate' }] : []),
    ...(event.registration_deadline ? [{ label: 'Reg. Deadline', value: fmtDateLong(event.registration_deadline), className: 'text-gray-300 font-mono font-semibold text-right', stack: true }] : []),
    { label: 'Registration Ticket', value: event.registration_required ? 'MANDATORY' : 'OPTIONAL', className: 'text-indigo-400 font-mono font-bold' },
    { label: 'Promoted Spotlight', value: event.is_featured ? 'Yes' : 'No', className: 'text-gray-200 font-bold' },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-gray-900 p-5 text-left">
      <h4 className="border-b border-white/[0.06] pb-2 font-mono text-xs font-bold tracking-wider text-gray-500 uppercase">
        Logistics Matrix
      </h4>
      <div className="space-y-2.5 text-xs">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex justify-between py-1 ${i > 0 ? 'border-t border-white/[0.06]' : ''} ${row.stack ? 'flex-col gap-1 sm:flex-row sm:items-center' : ''}`}
          >
            <span className="font-medium text-gray-500">{row.label}</span>
            <span className={row.className}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function ManageEventDetail({
  event,
  onBack,
  onSaved,
  onDeleted,
  onViewRegs,
  allCategories,
  roles = [],
  saveAction,
  deleteAction,
  uploadImageAction,
  deleteImageAction,
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaved = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onSaved?.();
  };

  if (editing) {
    return (
      <div className="pb-16 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/6 bg-white/[0.02] p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onBack}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-xs font-bold text-gray-300 transition-all hover:border-white/20 hover:bg-white/8 hover:text-white active:scale-95">
              <ChevronLeft size={14} /> Back to Events
            </button>
            {onViewRegs && (
              <button onClick={onViewRegs}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/8 transition-all active:scale-95">
                <Users className="h-3.5 w-3.5 text-indigo-400" />
                <span>Registrations</span>
                {(event.registrationCount ?? 0) > 0 && (
                  <span className="rounded-lg bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 tabular-nums">
                    {event.registrationCount}
                  </span>
                )}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/8 transition-all active:scale-95">
              <Eye className="h-3.5 w-3.5 text-sky-400" /> View Mode
            </button>
          </div>
        </div>

        <EditForm
          event={event}
          allCategories={allCategories}
          roles={roles}
          saveAction={saveAction}
          deleteAction={deleteAction}
          uploadImageAction={uploadImageAction}
          deleteImageAction={deleteImageAction}
          onSave={handleSaved}
          onCancel={() => setEditing(false)}
          onDelete={() => onDeleted?.()}
        />
      </div>
    );
  }

  // ── View mode ──
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-6 pb-16 text-left duration-200">

      {/* Detail Toolbar Row */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center">
        <button onClick={onBack}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-gray-300 transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.98]">
          <ArrowLeft className="h-4 w-4" /> Back to Events Grid
        </button>
        <div className="flex flex-wrap items-center gap-2.5">
          {saved && (
            <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 animate-bounce" /> Saved
            </span>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 font-mono text-[10px] text-gray-400">
            <Users className="h-4 w-4 text-indigo-400" />
            <span>Registrations: </span>
            <span className="font-bold text-indigo-300">{event.registrationCount ?? 0}</span>
          </div>
          {onViewRegs && (
            <button onClick={onViewRegs}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 font-mono text-[11px] font-semibold text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white">
              <Users className="h-3.5 w-3.5" /> View Registrants
            </button>
          )}
          <a
            href={`/events/${event.slug || event.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 font-mono text-[11px] font-semibold text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white">
            <ExternalLink className="h-3.5 w-3.5" /> Public Page
          </a>
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-500 active:scale-95">
            <Edit3 className="h-3.5 w-3.5" /> Edit Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Main content (public-style, no images) */}
        <div className="lg:col-span-8">
          <EventPublicContent event={event} />
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-6">
          <RegistrationStatsWidget event={event} onViewRegs={onViewRegs} />
          <EventDetailsWidget event={event} roles={roles} />
        </div>
      </div>
    </div>
  );
}
