/**
 * @file Member settings client component
 * @module MemberSettingsClient
 */

'use client';

import { useState, useTransition, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Lock,
  Mail,
  Phone,
  Check,
  X,
  Loader2,
  BadgeCheck,
  AlertTriangle,
  Info,
  LogOut,
  Globe,
  KeyRound,
  Shield,
  Palette,
  ExternalLink,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Camera,
  Upload,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { signOutAction } from '@/app/_lib/actions/actions';
import {
  uploadAvatarAction,
  removeAvatarAction,
} from '@/app/_lib/actions/avatar-actions';
import {
  ActionButton,
  Avatar,
  GlassCard,
  SectionHeader,
  Pill,
  StaggerList,
  GradientBar,
  EmptyState,
  PageShell,
  TabBar,
  PageHeader,
} from '@/app/account/_components/ui';
import { Settings as SettingsIcon } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/** Preference persisted to localStorage so it survives reloads. */
function useStoredPref(key, initial) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`neupc:settings:${key}`);
      if (raw != null) setValue(JSON.parse(raw));
    } catch {
      /* ignore corrupt values */
    }
  }, [key]);
  const set = (v) => {
    setValue(v);
    try {
      localStorage.setItem(`neupc:settings:${key}`, JSON.stringify(v));
    } catch {
      /* storage unavailable */
    }
  };
  return [value, set];
}

// ─── Sidebar nav items ─────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'connected', label: 'Connected accounts', icon: ExternalLink },
  { id: 'danger', label: 'Danger zone', icon: AlertTriangle },
];

// ─── Status meta ───────────────────────────────────────────────────────────────
const STATUS_META = {
  active: { label: 'Active Member', tone: 'emerald' },
  pending: { label: 'Pending Approval', tone: 'amber' },
  suspended: { label: 'Account Restricted', tone: 'rose' },
  rejected: { label: 'Application Rejected', tone: 'rose' },
};

// ─── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-4 last:border-0">
      <div className="flex-1">
        <p className="text-[13px] font-medium text-white/80">{label}</p>
        {description && (
          <p className="text-[11.5px] text-white/30">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-indigo-500' : 'bg-white/[0.08]'
        }`}
      >
        <span
          className={`inline-block size-3.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ─── Radio group ───────────────────────────────────────────────────────────────
function RadioGroup({ label, value, onChange, options }) {
  return (
    <div className="border-b border-white/[0.04] py-4 last:border-0">
      <p className="mb-3 text-[13px] font-semibold text-white/75">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-medium transition-all ${
              value === opt.value
                ? 'border-indigo-500/30 bg-indigo-500/8 text-indigo-300'
                : 'border-white/[0.07] bg-white/[0.02] text-white/40 hover:bg-white/[0.05] hover:text-white/65'
            }`}
          >
            {opt.icon && <opt.icon className="size-3.5" />}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Avatar Crop Modal ────────────────────────────────────────────────────────
function AvatarCropModal({ src, onApply, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const SIZE = 280; // output square px

  // draw whenever offset/zoom changes
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);

    const naturalMin = Math.min(img.naturalWidth, img.naturalHeight);
    const baseScale = SIZE / naturalMin;
    const scale = baseScale * zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const cx = SIZE / 2 + offset.x - w / 2;
    const cy = SIZE / 2 + offset.y - h / 2;

    // clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx, cy, w, h);
    ctx.restore();

    // ring
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [offset, zoom]);

  useEffect(() => {
    draw();
  }, [draw]);

  // pointer events for drag
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

  function reset() {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  }

  function apply() {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      onApply(new File([blob], 'avatar.png', { type: 'image/png' }));
    }, 'image/png');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div className="w-full overflow-hidden rounded-t-3xl border border-white/[0.08] bg-[#0d0d0d] shadow-2xl sm:max-w-[360px] sm:rounded-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[14px] font-semibold text-white/90">
              Crop &amp; position
            </p>
            <p className="mt-0.5 text-[11px] text-white/30">
              Drag to reposition · pinch or scroll to zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex size-7 items-center justify-center rounded-full bg-white/[0.06] text-white/40 transition hover:bg-white/10 hover:text-white/70"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* hidden img for drawing */}
        <img
          ref={imgRef}
          src={src}
          onLoad={draw}
          className="hidden"
          alt=""
          crossOrigin="anonymous"
        />

        {/* canvas — full width with dark surround */}
        <div className="relative mx-5 mb-4 flex justify-center">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              className="cursor-grab touch-none rounded-full ring-1 ring-white/10 active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            {/* corner hint */}
            <span className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 text-[10px] text-white/20">
              <Move className="size-3" /> drag
            </span>
          </div>
        </div>

        {/* zoom */}
        <div className="mx-5 mt-7 mb-1 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/35 transition hover:bg-white/10 hover:text-white/70"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <div className="relative h-1 flex-1 rounded-full bg-white/[0.08]">
            <div
              className="absolute top-0 left-0 h-1 rounded-full bg-indigo-500/70 transition-all"
              style={{ width: `${((zoom - 0.5) / 2.5) * 100}%` }}
            />
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="absolute inset-0 h-1 w-full cursor-pointer opacity-0"
            />
          </div>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/35 transition hover:bg-white/10 hover:text-white/70"
          >
            <ZoomIn className="size-3.5" />
          </button>
        </div>
        <p className="mb-4 text-center text-[10px] text-white/20">
          {Math.round(zoom * 100)}%
        </p>

        {/* actions */}
        <div className="flex gap-2 border-t border-white/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[12px] text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={apply}
            className="flex-1 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-indigo-500 active:bg-indigo-700"
          >
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar Uploader ──────────────────────────────────────────────────────────
function AvatarUploader({ user }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);
  const [cropSrc, setCropSrc] = useState(null); // data URL → show modal
  const [pendingRef, setPendingRef] = useState(null); // input element ref for reset
  const isImage = user.avatar_url?.startsWith('/api/image/');

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPendingRef(e.target);
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  }

  // "Relocate" — reload existing avatar into crop modal
  function handleRelocate() {
    setError(null);
    setCropSrc(user.avatar_url);
  }

  async function handleCropApply(file) {
    setCropSrc(null);
    if (pendingRef) {
      pendingRef.value = '';
      setPendingRef(null);
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const result = await uploadAvatarAction(fd);
      if (result?.error) setError(result.error);
      else router.refresh();
    } catch {
      setError('Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function handleCropCancel() {
    setCropSrc(null);
    if (pendingRef) {
      pendingRef.value = '';
      setPendingRef(null);
    }
  }

  async function handleRemove() {
    setError(null);
    setRemoving(true);
    try {
      const result = await removeAvatarAction();
      if (result?.error) setError(result.error);
      else router.refresh();
    } catch {
      setError('Failed to remove.');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-4">
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative shrink-0">
          <Avatar
            user={user}
            size="xl"
            src={isImage ? user.avatar_url : null}
            name={user.full_name}
          />
          <label className="absolute -right-1 -bottom-1 flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-gray-900 text-white shadow-xl transition-transform hover:scale-110">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={handleFileChange}
            />
          </label>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="text-[14px] font-semibold text-white">Profile Photo</p>
          <p className="mb-4 text-[12px] text-gray-500">
            Square image recommended. JPEG, PNG, WebP or GIF. Max 5 MB.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-[12px] font-bold text-violet-300 transition hover:bg-violet-500/20">
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {uploading ? 'Uploading...' : 'Upload new'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </label>
            {isImage && (
              <ActionButton icon={Move} onClick={handleRelocate} tone="ghost">
                Reposition
              </ActionButton>
            )}
            {isImage && (
              <ActionButton
                icon={Trash2}
                onClick={handleRemove}
                tone="danger"
                disabled={removing}
              >
                {removing ? 'Removing...' : 'Remove'}
              </ActionButton>
            )}
          </div>
          {error && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-rose-400">
              <AlertTriangle className="size-3.5" /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}



// ─── Section: Notifications ───────────────────────────────────────────────────
function NotificationsSection() {
  const [eventReminders, setEventReminders] = useStoredPref('event-reminders', true);
  const [notices, setNotices] = useStoredPref('notices', true);
  const [achievements, setAchievements] = useStoredPref('achievements', true);
  const [discussions, setDiscussions] = useStoredPref('discussions', false);
  const [weeklyDigest, setWeeklyDigest] = useStoredPref('weekly-digest', true);

  return (
    <div className="space-y-6">
      <GlassCard padding="p-0">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <SectionHeader
            icon={Bell}
            title="Notification Preferences"
            subtitle="Choose which updates you want to receive via email"
            accent="blue"
          />
        </div>
        <div className="px-5 pb-2">
          <ToggleRow
            label="Event reminders"
            description="Notify before registered events start"
            checked={eventReminders}
            onChange={setEventReminders}
          />
          <ToggleRow
            label="New notices"
            description="Important club announcements"
            checked={notices}
            onChange={setNotices}
          />
          <ToggleRow
            label="Achievement updates"
            description="When you earn new badges or milestones"
            checked={achievements}
            onChange={setAchievements}
          />
          <ToggleRow
            label="Discussion replies"
            description="When someone replies to your threads"
            checked={discussions}
            onChange={setDiscussions}
          />
          <ToggleRow
            label="Weekly digest"
            description="A summary of your activity every Monday"
            checked={weeklyDigest}
            onChange={setWeeklyDigest}
          />
        </div>
        <div className="flex items-start gap-2 border-t border-white/[0.04] bg-white/[0.01] px-5 py-4">
          <Info className="mt-0.5 size-3.5 shrink-0 text-gray-500" />
          <p className="text-[11px] leading-relaxed text-gray-500">
            Email delivery is managed at the club level. These preferences are
            saved locally in this browser.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────
function AppearanceSection() {
  const [theme, setTheme] = useStoredPref('theme', 'dark');
  const [density, setDensity] = useStoredPref('density', 'comfortable');
  const [accent, setAccent] = useStoredPref('accent', 'violet');

  const ACCENTS = [
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'violet', label: 'Violet', color: 'bg-violet-500' },
    { value: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
    { value: 'amber', label: 'Amber', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <GlassCard padding="p-0">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <SectionHeader
            icon={Palette}
            title="Interface Appearance"
            subtitle="Customize the visual experience of your dashboard"
            accent="violet"
          />
        </div>
        <div className="px-5 py-2">
          <RadioGroup
            label="Color Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'system', label: 'System', icon: Monitor },
            ]}
          />
          <RadioGroup
            label="Layout Density"
            value={density}
            onChange={setDensity}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}
          />

          <div className="border-b border-white/[0.04] py-4 last:border-0">
            <p className="mb-3 text-[13px] font-semibold text-gray-200">
              Accent Color
            </p>
            <div className="flex gap-4">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setAccent(a.value)}
                  className={`relative flex size-9 items-center justify-center rounded-xl transition-all hover:scale-110 ${
                    accent === a.value
                      ? 'ring-2 ring-white/40 ring-offset-4 ring-offset-gray-950'
                      : 'hover:ring-1 hover:ring-white/20'
                  } ${a.color}`}
                >
                  {accent === a.value && (
                    <Check className="size-4 text-white" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-gray-500">
              Appearance settings are saved locally in this browser.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Section: Security ────────────────────────────────────────────────────────
function SecuritySection({ user }) {
  return (
    <div className="space-y-6">
      <GlassCard padding="p-0">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <SectionHeader
            icon={Shield}
            title="Account Security"
            subtitle="Manage your authentication methods and access"
            accent="indigo"
          />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-indigo-400">
                <KeyRound className="size-5" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-white">
                  Authentication Method
                </p>
                <p className="text-[12px] text-gray-500">
                  {user.provider
                    ? `Managed by ${user.provider.charAt(0).toUpperCase() + user.provider.slice(1)} OAuth`
                    : 'Email & password authentication'}
                </p>
              </div>
            </div>
            {user.provider && (
              <Pill tone="blue" icon={Globe}>
                OAuth Enabled
              </Pill>
            )}
          </div>

          {user.suspension_expires_at && (
            <div className="flex items-start gap-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-400" />
              <div>
                <p className="text-[14px] font-bold text-rose-400">
                  Account Restricted
                </p>
                <p className="text-[12px] text-rose-400/70">
                  Temporary suspension active until{' '}
                  {new Date(user.suspension_expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <SectionHeader
              icon={Activity}
              title="Active Sessions"
              subtitle="Device and browser sessions currently logged in"
              accent="gray"
            />
            <EmptyState
              icon={Monitor}
              title="Session management coming soon"
              description="You will be able to view and manage your active devices here."
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Section: Connected accounts ──────────────────────────────────────────────
function ConnectedSection({ user }) {
  const platforms = [
    {
      label: 'Google',
      key: 'google',
      icon: Globe,
      connected: user.provider === 'google',
    },
    {
      label: 'GitHub',
      key: 'github',
      icon: Code2,
      connected: user.provider === 'github',
    },
    {
      label: 'Facebook',
      key: 'facebook',
      icon: Globe,
      connected: user.provider === 'facebook',
    },
  ];

  return (
    <div className="space-y-6">
      <GlassCard padding="p-0">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <SectionHeader
            icon={Globe}
            title="Connected Accounts"
            subtitle="OAuth providers linked to your NEUPC identity"
            accent="sky"
          />
        </div>
        <div className="divide-y divide-white/[0.04]">
          {platforms.map((p) => (
            <div
              key={p.key}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.01]"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-gray-400">
                  <p.icon className="size-5" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white">
                    {p.label}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    {p.connected
                      ? 'Currently used for login'
                      : 'Not linked to this account'}
                  </p>
                </div>
              </div>
              {p.connected ? (
                <Pill tone="emerald" icon={Check}>
                  Connected
                </Pill>
              ) : (
                <Pill tone="gray">Not linked</Pill>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Section: Danger zone ─────────────────────────────────────────────────────
function DangerSection() {
  return (
    <div className="space-y-6">
      <GlassCard
        padding="p-0"
        className="border-rose-500/20 bg-rose-500/[0.02]"
      >
        <div className="border-b border-rose-500/10 px-5 py-4">
          <SectionHeader
            icon={AlertTriangle}
            title="Danger Zone"
            subtitle="Irreversible or highly sensitive account actions"
            accent="rose"
          />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[14px] font-semibold text-white">Sign Out</p>
              <p className="text-[12px] text-gray-500">
                End your current session on this device
              </p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-white/[0.1]"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[14px] font-bold text-rose-400">
                Delete Account
              </p>
              <p className="text-[12px] text-rose-400/70">
                Permanently remove all your data and access
              </p>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-[12.5px] font-bold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600">
              Delete account
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default function MemberSettingsClient({ user }) {
  const [active, setActive] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p && SECTIONS.some((t) => t.id === p)) return p;
    }
    return 'notifications';
  });

  const handleTabChange = useCallback((tabId) => {
    setActive(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  const content = {
    notifications: <NotificationsSection />,
    appearance: <AppearanceSection />,
    security: <SecuritySection user={user} />,
    connected: <ConnectedSection user={user} />,
    danger: <DangerSection />,
  };

  const uiTabs = SECTIONS.map((s) => ({
    value: s.id,
    label: s.label,
    icon: s.icon,
  }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Manage your account, preferences, and security"
        accent="violet"
      />
      <TabBar tabs={uiTabs} value={active} onChange={handleTabChange} />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {content[active]}
        </motion.div>
      </AnimatePresence>
    </PageShell>
  );
}
