'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Loader2,
  CheckCircle2,
  PlusCircle,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import {
  CATEGORIES,
  STATUSES,
  VENUE_TYPES,
  getStatusConfig,
  getCategoryConfig,
  getVenueConfig,
  toLocalDateTimeInput,
} from './eventConfig';
import { createEventAction, updateEventAction } from '@/app/_lib/event-actions';

// ─── field styles ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-white/20 focus:bg-white/7 disabled:opacity-50 scheme-dark';

const labelCls = 'block text-xs font-semibold text-gray-400 mb-1.5';

const sectionCls = 'space-y-4 rounded-2xl border border-white/6 bg-white/3 p-4';

// ─── section header ───────────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
      {children}
    </h3>
  );
}

// ─── toggle button ────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/4 px-3.5 py-3 transition-colors hover:bg-white/6">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
      <div
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-white/10'}`}
        onClick={() => onChange(!value)}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </div>
    </label>
  );
}

// ─── segmented selector ───────────────────────────────────────────────────────

function SegmentedSelect({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  getExtra,
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const val = getValue ? getValue(opt) : opt;
        const label = getLabel ? getLabel(opt) : opt;
        const extra = getExtra ? getExtra(opt) : null;
        const active = value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              active
                ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                : 'border-white/8 bg-white/4 text-gray-400 hover:border-white/15 hover:text-gray-200'
            }`}
          >
            {extra && <span className="mr-1">{extra}</span>}
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function EventFormModal({ event, onClose, onSaved }) {
  const isEdit = !!event;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ── form state ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [content, setContent] = useState(event?.content ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [venueType, setVenueType] = useState(event?.venue_type ?? 'offline');
  const [category, setCategory] = useState(event?.category ?? '');
  const [status, setStatus] = useState(event?.status ?? 'draft');
  const [startDate, setStartDate] = useState(
    toLocalDateTimeInput(event?.start_date)
  );
  const [endDate, setEndDate] = useState(toLocalDateTimeInput(event?.end_date));
  const [coverImage, setCoverImage] = useState(event?.cover_image ?? '');
  const [regRequired, setRegRequired] = useState(
    event?.registration_required ?? false
  );
  const [regDeadline, setRegDeadline] = useState(
    toLocalDateTimeInput(event?.registration_deadline)
  );
  const [maxParticipants, setMaxParticipants] = useState(
    event?.max_participants ?? ''
  );
  const [isFeatured, setIsFeatured] = useState(event?.is_featured ?? false);
  const [tags, setTags] = useState(event?.tags?.join(', ') ?? '');
  const [externalUrl, setExternalUrl] = useState(event?.external_url ?? '');
  const [registrationUrl, setRegistrationUrl] = useState(
    event?.registration_url ?? ''
  );

  // close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── submit ──────────────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    if (isEdit) fd.set('id', event.id);
    fd.set('title', title);
    fd.set('description', description);
    fd.set('content', content);
    fd.set('location', location);
    fd.set('venue_type', venueType);
    if (category) fd.set('category', category);
    fd.set('status', status);
    fd.set('start_date', startDate);
    if (endDate) fd.set('end_date', endDate);
    if (coverImage) fd.set('cover_image', coverImage);
    fd.set('registration_required', String(regRequired));
    if (regRequired && regDeadline)
      fd.set('registration_deadline', regDeadline);
    if (maxParticipants) fd.set('max_participants', String(maxParticipants));
    fd.set('is_featured', String(isFeatured));
    if (tags) fd.set('tags', tags);
    if (externalUrl) fd.set('external_url', externalUrl);
    if (registrationUrl) fd.set('registration_url', registrationUrl);

    startTransition(async () => {
      const action = isEdit ? updateEventAction : createEventAction;
      const result = await action(fd);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSaved(result.event, isEdit ? 'edit' : 'create');
        onClose();
      }, 700);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15">
              {isEdit ? (
                <Edit3 className="h-4.5 w-4.5 text-blue-400" />
              ) : (
                <PlusCircle className="h-4.5 w-4.5 text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-white">
                {isEdit ? 'Edit Event' : 'Create New Event'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEdit
                  ? `Editing "${event.title}"`
                  : 'Fill in the details below'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* error */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Basic Info ── */}
          <div className={sectionCls}>
            <SectionHeader>Basic Information</SectionHeader>

            {/* title */}
            <div>
              <label className={labelCls}>
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ICPC Regional Qualifying Round"
                className={inputCls}
              />
            </div>

            {/* description */}
            <div>
              <label className={labelCls}>Short Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary shown on cards…"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* content */}
            <div>
              <label className={labelCls}>Full Content / Details</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detailed description, rules, requirements…"
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* cover image */}
            <div>
              <label className={labelCls}>Cover Image URL</label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://…"
                className={inputCls}
              />
              {coverImage && (
                <img
                  src={coverImage}
                  alt="preview"
                  className="mt-2 h-24 w-full rounded-xl object-cover opacity-80"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>

          {/* ── Category & Status ── */}
          <div className={sectionCls}>
            <SectionHeader>Category & Status</SectionHeader>

            {/* category */}
            <div>
              <label className={labelCls}>Category</label>
              <SegmentedSelect
                options={CATEGORIES}
                value={category}
                onChange={setCategory}
                getExtra={(c) => getCategoryConfig(c).icon}
              />
            </div>

            {/* status */}
            <div>
              <label className={labelCls}>Publication Status</label>
              <SegmentedSelect
                options={STATUSES}
                value={status}
                onChange={setStatus}
                getLabel={(s) => getStatusConfig(s).label}
              />
            </div>
          </div>

          {/* ── Date & Location ── */}
          <div className={sectionCls}>
            <SectionHeader>Date & Location</SectionHeader>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* start date */}
              <div>
                <label className={labelCls}>
                  <Calendar className="mr-1 inline h-3 w-3" />
                  Start Date / Time <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* end date */}
              <div>
                <label className={labelCls}>
                  <Calendar className="mr-1 inline h-3 w-3" />
                  End Date / Time
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className={inputCls}
                />
              </div>
            </div>

            {/* location */}
            <div>
              <label className={labelCls}>
                <MapPin className="mr-1 inline h-3 w-3" />
                Location / Venue <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Department Auditorium, Zoom Meeting…"
                className={inputCls}
              />
            </div>

            {/* venue type */}
            <div>
              <label className={labelCls}>Venue Type</label>
              <SegmentedSelect
                options={VENUE_TYPES}
                value={venueType}
                onChange={setVenueType}
                getLabel={(v) => getVenueConfig(v).label}
                getExtra={(v) => getVenueConfig(v).icon}
              />
            </div>
          </div>

          {/* ── Registration ── */}
          <div className={sectionCls}>
            <SectionHeader>Registration Settings</SectionHeader>

            <Toggle
              value={regRequired}
              onChange={setRegRequired}
              label="Registration Required"
              description="Members must register before attending"
            />

            {regRequired && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Registration Deadline</label>
                  <input
                    type="datetime-local"
                    value={regDeadline}
                    onChange={(e) => setRegDeadline(e.target.value)}
                    max={startDate || undefined}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max Participants</label>
                  <input
                    type="number"
                    min="1"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {regRequired && (
              <div>
                <label className={labelCls}>Registration Form URL</label>
                <input
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  placeholder="https://forms.google.com/…"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* ── Extra ── */}
          <div className={sectionCls}>
            <SectionHeader>Additional Details</SectionHeader>

            <Toggle
              value={isFeatured}
              onChange={setIsFeatured}
              label="Feature on Homepage"
              description="Highlight this event in the public events section"
            />

            <div>
              <label className={labelCls}>External URL</label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://… (contest page, event site)"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="icpc, programming, team (comma-separated)"
                className={inputCls}
              />
              <p className="mt-1 text-[10px] text-gray-600">
                Separate tags with commas
              </p>
            </div>
          </div>

          {/* ── actions ── */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/8 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || success}
              className="flex min-w-32 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-70"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>{isEdit ? 'Save Changes' : 'Create Event'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
