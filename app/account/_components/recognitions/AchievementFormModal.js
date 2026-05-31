/**
 * @file Achievement form modal — create / edit dialog for club
 *   achievements with fields for name, description, icon, criteria,
 *   tier, and point value.
 * @module ExecutiveAchievementFormModal
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  ACHIEVEMENT_CATEGORIES,
  CONTEST_PLATFORMS,
  COMMON_RESULTS,
  generateYearOptions,
} from './achievementConfig';
import {
  createAchievementAction,
  updateAchievementAction,
  uploadAchievementFeaturedPhotoAction,
  deleteAchievementFeaturedPhotoAction,
} from '@/app/_lib/actions/achievement-actions';
import { useScrollLock } from '@/app/_lib/utils/hooks';

export default function AchievementFormModal({ achievement, onClose }) {
  const router = useRouter();
  const isEdit = Boolean(achievement);
  useScrollLock();
  const formRef = useRef(null);

  const [isTeam, setIsTeam] = useState(achievement?.is_team ?? false);
  const [isFeatured, setIsFeatured] = useState(
    achievement?.is_featured ?? false
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(() =>
    achievement?.category
      ? achievement.category
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  );
  const [featuredPhotoFile, setFeaturedPhotoFile] = useState(null);
  const [featuredPhotoPreviewUrl, setFeaturedPhotoPreviewUrl] = useState(
    achievement?.featured_photo?.url ?? null
  );
  const [clearFeaturedPhoto, setClearFeaturedPhoto] = useState(false);
  const featuredPhotoInputRef = useRef(null);
  const [cropSrc, setCropSrc] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleCropApply(croppedFile) {
    setFeaturedPhotoFile(croppedFile);
    setFeaturedPhotoPreviewUrl(URL.createObjectURL(croppedFile));
    setClearFeaturedPhoto(false);
    setCropSrc(null);
  }

  function handleCropCancel() {
    setCropSrc(null);
    if (featuredPhotoInputRef.current) {
      featuredPhotoInputRef.current.value = '';
    }
  }

  function handleReposition() {
    if (featuredPhotoPreviewUrl) {
      setCropSrc(featuredPhotoPreviewUrl);
    }
  }

  const years = generateYearOptions();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(formRef.current);
    fd.set('is_team', String(isTeam));
    fd.set('is_featured', String(isFeatured));
    fd.set('category', selectedCategories.join(', '));

    const res = isEdit
      ? await updateAchievementAction(fd)
      : await createAchievementAction(fd);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    // Handle featured photo changes
    const targetId = isEdit ? achievement.id : res.id;
    if (targetId) {
      if (clearFeaturedPhoto && !featuredPhotoFile) {
        const dfd = new FormData();
        dfd.set('achievement_id', targetId);
        const photoRes = await deleteAchievementFeaturedPhotoAction(dfd);
        if (photoRes?.error) {
          setError(photoRes.error);
          setLoading(false);
          return;
        }
      } else if (featuredPhotoFile) {
        const ufd = new FormData();
        ufd.set('achievement_id', targetId);
        ufd.set('file', featuredPhotoFile);
        const photoRes = await uploadAchievementFeaturedPhotoAction(ufd);
        if (photoRes?.error) {
          setError(photoRes.error);
          setLoading(false);
          return;
        }
      }
    }

    setLoading(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      {cropSrc && (
        <FeaturedPhotoCropModal
          src={cropSrc}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
          defaultFeatured={isFeatured}
        />
      )}
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700/50 bg-slate-900 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? '✏️ Edit Achievement' : '➕ Add Achievement'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* ── Form ────────────────────────────────────────────────────── */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 p-6">
          {isEdit && <input type="hidden" name="id" value={achievement.id} />}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={achievement?.title ?? ''}
              placeholder="ICPC Asia Regional 2025 – Champion"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Contest Name + URL */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Contest / Event Name <span className="text-red-400">*</span>
              </label>
              <input
                name="contest_name"
                required
                defaultValue={achievement?.contest_name ?? ''}
                placeholder="ICPC Asia Regional"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Contest URL
              </label>
              <input
                name="contest_url"
                type="url"
                defaultValue={achievement?.contest_url ?? ''}
                placeholder="https://icpc.global/…"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Platform + Profile URL */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Platform
              </label>
              <select
                name="platform"
                defaultValue={achievement?.platform ?? ''}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">— Select platform —</option>
                {CONTEST_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Profile / Submission URL
              </label>
              <input
                name="profile_url"
                type="url"
                defaultValue={achievement?.profile_url ?? ''}
                placeholder="https://codeforces.com/profile/handle"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Result + Year + Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Result <span className="text-red-400">*</span>
              </label>
              <input
                name="result"
                list="result-options"
                required
                defaultValue={achievement?.result ?? ''}
                placeholder="Champion"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <datalist id="result-options">
                {COMMON_RESULTS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Year <span className="text-red-400">*</span>
              </label>
              <select
                name="year"
                required
                defaultValue={achievement?.year ?? new Date().getFullYear()}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Achievement Date
              </label>
              <input
                name="achievement_date"
                type="date"
                defaultValue={achievement?.achievement_date ?? ''}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category — multi-select tag picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Categories
              {selectedCategories.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">
                  {selectedCategories.length} selected
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENT_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setSelectedCategories((prev) =>
                        active ? prev.filter((c) => c !== cat) : [...prev, cat]
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      active
                        ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                        : 'border-slate-700/60 bg-slate-800/60 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={achievement?.description ?? ''}
              placeholder="Briefly describe the achievement…"
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Featured Photo */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Featured Photo{' '}
              <span className="text-xs font-normal text-slate-500">
                (shown on public page)
              </span>
            </label>
            {featuredPhotoPreviewUrl ? (
              <div className="relative inline-block">
                <div className={`relative overflow-hidden rounded-xl border border-slate-700/60 transition-all duration-300 ${isFeatured ? 'h-24 w-56' : 'h-32 w-48'}`}>
                  <Image
                    src={featuredPhotoPreviewUrl}
                    alt="Featured photo preview"
                    fill
                    className="object-cover"
                    sizes="192px"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFeaturedPhotoFile(null);
                    setFeaturedPhotoPreviewUrl(null);
                    setClearFeaturedPhoto(true);
                    if (featuredPhotoInputRef.current)
                      featuredPhotoInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
                  title="Remove featured photo"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3 w-3"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => featuredPhotoInputRef.current?.click()}
                    className="text-xs text-amber-400 underline underline-offset-2 hover:text-amber-300"
                  >
                    Replace photo
                  </button>
                  <button
                    type="button"
                    onClick={handleReposition}
                    className="text-xs text-amber-400 underline underline-offset-2 hover:text-amber-300"
                  >
                    Reposition photo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => featuredPhotoInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/40 px-4 py-3 text-sm text-slate-400 transition-colors hover:border-amber-500/50 hover:text-amber-400"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                Upload featured photo
              </button>
            )}
            <input
              ref={featuredPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Featured toggle */}
          <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-200">
                ⭐ Featured achievement
              </p>
              <p className="text-xs text-slate-500">
                Shown in the highlighted section on the public page
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFeatured((f) => !f)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${isFeatured ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${isFeatured ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Team toggle */}
          <div className="space-y-3 rounded-xl border border-slate-700/40 bg-slate-800/30 p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsTeam((t) => !t)}
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${isTeam ? 'bg-violet-600' : 'bg-slate-700'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${isTeam ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
              <span className="text-sm text-slate-300">
                {isTeam ? '👥 Team achievement' : '👤 Individual achievement'}
              </span>
            </div>

            {isTeam && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Team Name
                </label>
                <input
                  name="team_name"
                  defaultValue={achievement?.team_name ?? ''}
                  placeholder="NEU Coders Alpha"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Participants (plain text) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Participants{' '}
              <span className="text-xs text-slate-500">
                (comma-separated names)
              </span>
            </label>
            <input
              name="participants"
              defaultValue={achievement?.participants?.join(', ') ?? ''}
              placeholder="Alice, Bob, Charlie"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              These are informal labels. Link registered members via the
              "Members" button on the card.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-900/30 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-700/50 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-amber-900/30 transition-colors hover:bg-amber-700 disabled:opacity-60"
            >
              {loading
                ? 'Saving…'
                : isEdit
                  ? 'Update Achievement'
                  : 'Create Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeaturedPhotoCropModal({ src, onApply, onCancel, defaultFeatured = false }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(defaultFeatured ? '21:9' : '3:2');

  const aspectWidth = aspect === '21:9' ? 483 : 480;
  const aspectHeight = aspect === '21:9' ? 207 : 320;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, aspectWidth, aspectHeight);

    const baseScale = Math.max(aspectWidth / img.naturalWidth, aspectHeight / img.naturalHeight);
    const scale = baseScale * zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const cx = aspectWidth / 2 + offset.x - w / 2;
    const cy = aspectHeight / 2 + offset.y - h / 2;

    ctx.save();
    ctx.drawImage(img, cx, cy, w, h);
    ctx.restore();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; // amber border overlay
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, aspectWidth - 2, aspectHeight - 2);
  }, [offset, zoom, aspectWidth, aspectHeight]);

  useEffect(() => {
    draw();
  }, [draw]);

  function onPointerDown(e) {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  }

  function onPointerUp() {
    dragging.current = false;
  }

  function handleWheel(e) {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom((z) => Math.min(3, Math.max(1, +(z + delta).toFixed(2))));
  }

  function reset() {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  }

  function apply() {
    const img = imgRef.current;
    if (!img) return;

    // Calculate dimensions at high resolution based on zoom and aspect boundaries
    const baseScale = Math.max(aspectWidth / img.naturalWidth, aspectHeight / img.naturalHeight);
    const scale = baseScale * zoom;

    // Visual dimensions of the drawn image
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    // Visual coordinates of the drawn image relative to the visual canvas
    const cx = aspectWidth / 2 + offset.x - w / 2;
    const cy = aspectHeight / 2 + offset.y - h / 2;

    // Crop box width and height scaled up to match the original image coordinates
    const sourceWidth = aspectWidth / scale;
    const sourceHeight = aspectHeight / scale;

    // Create an offscreen canvas at original pixel resolution to avoid any downscaling quality loss
    const offscreen = document.createElement('canvas');
    offscreen.width = sourceWidth;
    offscreen.height = sourceHeight;
    const ctx = offscreen.getContext('2d');

    // Draw the full original image onto the high-res offscreen canvas at the exact relative high-res position
    ctx.drawImage(img, cx / scale, cy / scale, img.naturalWidth, img.naturalHeight);

    offscreen.toBlob((blob) => {
      onApply(new File([blob], 'featured_photo.png', { type: 'image/png' }));
    }, 'image/png');
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-sm font-semibold text-white/90">
              Crop &amp; Position Featured Photo
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Drag to reposition · slide or scroll to zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* hidden img */}
        <img
          ref={imgRef}
          src={src}
          onLoad={draw}
          className="hidden"
          alt=""
          crossOrigin={src?.startsWith('data:') || src?.startsWith('blob:') ? undefined : 'anonymous'}
        />

        {/* Crop Aspect Ratio Toggle */}
        <div className="mx-5 mb-4 flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-950/40 p-2.5">
          <span className="text-xs font-medium text-slate-400">Crop Mode:</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAspect('3:2');
                reset();
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                aspect === '3:2'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Standard (3:2)
            </button>
            <button
              type="button"
              onClick={() => {
                setAspect('21:9');
                reset();
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                aspect === '21:9'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Featured (21:9)
            </button>
          </div>
        </div>

        {/* canvas container */}
        <div className="relative mx-5 mb-4 flex justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-2">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={aspectWidth}
              height={aspectHeight}
              className="max-w-full cursor-grab touch-none rounded-lg active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onWheel={handleWheel}
            />
            <span className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 text-[11px] text-slate-500">
              <Move className="h-3.5 w-3.5" /> drag or scroll to reposition
            </span>
          </div>
        </div>

        {/* zoom */}
        <div className="mx-5 mt-8 mb-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="relative h-1.5 flex-1 rounded-full bg-slate-800">
            <div
              className="absolute top-0 left-0 h-1.5 rounded-full bg-amber-500/70 transition-all"
              style={{ width: `${((zoom - 1) / 2) * 100}%` }}
            />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="absolute inset-0 h-1.5 w-full cursor-pointer opacity-0"
            />
          </div>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-center text-xs text-slate-500">
          {Math.round(zoom * 100)}%
        </p>

        {/* actions */}
        <div className="flex gap-3 border-t border-slate-700/50 px-5 py-4">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs text-slate-300 transition hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={apply}
            className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-500 active:bg-amber-700"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
