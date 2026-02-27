'use client';

import { useState, useTransition } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link,
  Tag,
  Layers,
  Star,
} from 'lucide-react';
import {
  RESOURCE_TYPES,
  DIFFICULTIES,
  CATEGORIES,
  getTypeConfig,
  getDifficultyConfig,
} from './resourceConfig';
import {
  createResourceAction,
  updateResourceAction,
} from '@/app/_lib/resource-actions';

// ─── Segmented select ─────────────────────────────────────────────────────────

function SegmentedSelect({ options, value, onChange, renderOption }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            value === opt
              ? 'bg-white/15 text-white ring-1 ring-white/20'
              : 'bg-white/4 text-gray-400 hover:bg-white/8 hover:text-gray-200'
          }`}
        >
          {renderOption ? renderOption(opt) : opt}
        </button>
      ))}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label, activeColor = 'bg-blue-500' }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2.5 select-none"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
          value ? activeColor : 'bg-white/12'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
      <span className="text-xs text-gray-300">{label}</span>
    </button>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ label, icon: Icon, children }) {
  return (
    <div className="space-y-4 px-6 py-5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-400">{label}</label>
      {children}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ResourceFormModal({
  mode = 'create',
  resource = null,
  onClose,
}) {
  const isEdit = mode === 'edit' && resource;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(isEdit ? (resource.title ?? '') : '');
  const [description, setDescription] = useState(
    isEdit ? (resource.description ?? '') : ''
  );
  const [url, setUrl] = useState(isEdit ? (resource.url ?? '') : '');
  const [resourceType, setResourceType] = useState(
    isEdit ? (resource.resource_type ?? 'article') : 'article'
  );
  const [category, setCategory] = useState(
    isEdit ? (resource.category ?? '') : ''
  );
  const [difficulty, setDifficulty] = useState(
    isEdit ? (resource.difficulty ?? '') : ''
  );
  const [tags, setTags] = useState(
    isEdit ? (resource.tags ?? []).join(', ') : ''
  );
  const [thumbnail, setThumbnail] = useState(
    isEdit ? (resource.thumbnail ?? '') : ''
  );
  const [isFree, setIsFree] = useState(
    isEdit ? (resource.is_free ?? true) : true
  );
  const [isFeatured, setIsFeatured] = useState(
    isEdit ? (resource.is_featured ?? false) : false
  );

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!url.trim()) {
      setError('URL is required.');
      return;
    }
    if (!category.trim()) {
      setError('Category is required.');
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      if (isEdit) fd.set('id', resource.id);
      fd.set('title', title);
      fd.set('description', description);
      fd.set('url', url);
      fd.set('resource_type', resourceType);
      fd.set('category', category);
      fd.set('difficulty', difficulty);
      fd.set('tags', tags);
      fd.set('thumbnail', thumbnail);
      fd.set('is_free', String(isFree));
      fd.set('is_featured', String(isFeatured));

      const action = isEdit ? updateResourceAction : createResourceAction;
      const result = await action(fd);

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => onClose(), 1200);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-xl rounded-2xl border border-white/10 bg-gray-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/8 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15">
            <Layers className="h-4.5 w-4.5 text-teal-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">
              {isEdit ? 'Edit Resource' : 'Add Resource'}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit
                ? `Editing: ${resource.title}`
                : 'Add a learning resource to the library'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white/8 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-white/6">
          {/* ── Basic Info ───────────────────────────────────────────────────── */}
          <Section label="Basic Info" icon={Link}>
            <Field label="Title *">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CP3 — Competitive Programming 3"
                className="input-field"
                maxLength={200}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this resource covers…"
                rows={2}
                className="input-field resize-none"
                maxLength={500}
              />
            </Field>
            <Field label="URL *">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="input-field"
              />
            </Field>
          </Section>

          {/* ── Classification ───────────────────────────────────────────────── */}
          <Section label="Classification" icon={Tag}>
            <Field label="Resource Type">
              <SegmentedSelect
                options={RESOURCE_TYPES}
                value={resourceType}
                onChange={setResourceType}
                renderOption={(opt) => {
                  const t = getTypeConfig(opt);
                  return (
                    <span>
                      {t.emoji} {t.label}
                    </span>
                  );
                }}
              />
            </Field>

            <Field label="Category *">
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field appearance-none pr-8"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Difficulty">
              <SegmentedSelect
                options={['', ...DIFFICULTIES]}
                value={difficulty}
                onChange={setDifficulty}
                renderOption={(opt) => {
                  if (!opt) return 'Not specified';
                  const d = getDifficultyConfig(opt);
                  return (
                    <span className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${d.dot}`} />
                      {d.label}
                    </span>
                  );
                }}
              />
            </Field>
          </Section>

          {/* ── Media & Extra ─────────────────────────────────────────────────── */}
          <Section label="Media & Details" icon={Star}>
            <Field label="Thumbnail URL">
              <div className="flex gap-2">
                <input
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://…"
                  className="input-field flex-1"
                />
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt="preview"
                    className="h-9.5 w-15 rounded-lg border border-white/8 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </Field>
            <Field label="Tags (comma-separated)">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="dp, graphs, binary-search"
                className="input-field"
              />
            </Field>
            <div className="flex flex-wrap gap-6">
              <Toggle
                value={isFree}
                onChange={setIsFree}
                label="Free resource"
                activeColor="bg-emerald-500"
              />
              <Toggle
                value={isFeatured}
                onChange={setIsFeatured}
                label="Featured"
                activeColor="bg-amber-500"
              />
            </div>
          </Section>

          {/* ── Footer ──────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 px-6 py-4">
            {error ? (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            ) : success ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isEdit ? 'Updated!' : 'Created!'}
              </div>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs text-gray-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || success}
                className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Add Resource'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          color: #f4f4f5;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field::placeholder {
          color: #52525b;
        }
        .input-field:focus {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
}
