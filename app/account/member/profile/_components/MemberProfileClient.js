/**
 * @file Member profile client dashboard component.
 * Redesigned for FHD screens using high-fidelity glassmorphic sections matching the public profile view.
 * All displayed data is read from the database; sections without a data
 * source are hidden rather than filled with placeholders.
 * Uses a tabbed layout, unified styling, and reduces duplicate/redundant data.
 * @module MemberProfileClient
 */

'use client';

import {
  useState,
  useTransition,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Loader2,
  ExternalLink,
  ChevronRight,
  Trophy,
  Award,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  Search,
  Pencil,
  Code2,
  Globe,
  User,
  Activity,
  GraduationCap,
  BookOpen,
  Hash,
  Phone,
  Mail,
  PenTool,
  Flame,
  Target,
  Facebook,
  Github,
  Linkedin,
  Camera,
  Upload,
  Trash2,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Info,
  BadgeCheck,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  updateMemberProfileAction,
  updateMemberInfoAction,
} from '@/app/_lib/actions/member-profile-actions';
import {
  uploadAvatarAction,
  removeAvatarAction,
} from '@/app/_lib/actions/avatar-actions';
import {
  GlassCard,
  SectionHeader,
  Avatar,
  PageShell,
  ActionButton,
  Pill,
} from '@/app/account/_components/ui';

const HANDLE_PLATFORMS = [
  { id: 'codeforces', name: 'Codeforces', color: '#ef4444' },
  { id: 'atcoder', name: 'AtCoder', color: '#38bdf8' },
  { id: 'leetcode', name: 'LeetCode', color: '#fbbf24' },
  { id: 'codechef', name: 'CodeChef', color: '#fb923c' },
  { id: 'github', name: 'GitHub', color: '#e2e8f0' },
  { id: 'linkedin', name: 'LinkedIn', color: '#3b82f6' },
  { id: 'facebook', name: 'Facebook', color: '#60a5fa' },
];

function FormField({ label, name, defaultValue, placeholder, textarea }) {
  const cls =
    'w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-white/[0.04] focus:ring-1 focus:ring-violet-500/50 transition';
  return (
    <div>
      <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.1em] text-gray-400 uppercase">
        {label}
      </label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {Icon && <Icon size={16} className="text-[#B6F36B]" />}
      <h3 className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
        {label}
      </h3>
    </div>
  );
}

function AvatarCropModal({ src, onApply, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const SIZE = 280;

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

    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx, cy, w, h);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [offset, zoom]);

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

        <img
          ref={imgRef}
          src={src}
          onLoad={draw}
          className="hidden"
          alt=""
          crossOrigin="anonymous"
        />

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
            <span className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 text-[10px] text-white/20">
              <Move className="size-3" /> drag
            </span>
          </div>
        </div>

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

const getSocialLink = (platform, val) => {
  if (!val) return '#';
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  if (platform === 'github') return `https://github.com/${val}`;
  if (platform === 'linkedin') return `https://linkedin.com/in/${val}`;
  if (platform === 'facebook') return `https://facebook.com/${val}`;
  return val;
};

export default function MemberProfileClient({
  user,
  memberProfile,
  handles = [],
  userStats = null,
  dailyActivity = [],
  memberAchievements = [],
  certificates = [],
  contestParticipations = [],
}) {
  const router = useRouter();
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingHandles, setEditingHandles] = useState(false);

  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingHandles, setSavingHandles] = useState(false);

  const [cropSrc, setCropSrc] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [heatmapRange, setHeatmapRange] = useState('12');

  // Real solve-activity map: date string -> problems solved that day
  const activityByDate = useMemo(() => {
    const map = {};
    for (const row of dailyActivity) {
      if (row?.activity_date) map[row.activity_date] = row.problems_solved || 0;
    }
    return map;
  }, [dailyActivity]);

  const getBaseProfileFormData = () => {
    const fd = new FormData();
    fd.set('username', memberProfile?.username || '');
    fd.set('bio', memberProfile?.bio || '');
    fd.set(
      'skills',
      memberProfile?.skills ? memberProfile.skills.join(', ') : ''
    );
    fd.set(
      'interests',
      memberProfile?.interests ? memberProfile.interests.join(', ') : ''
    );
    fd.set('linkedin', memberProfile?.linkedin || '');
    fd.set('github', memberProfile?.github || '');
    fd.set('facebook', memberProfile?.facebook || '');
    fd.set('x_handle', memberProfile?.x_handle || '');

    const platforms = [
      'codeforces',
      'atcoder',
      'leetcode',
      'codechef',
      'hackerrank',
      'spoj',
      'cses',
      'vjudge',
      'toph',
      'lightoj',
      'uva',
      'beecrowd',
      'facebookhackercup',
    ];
    platforms.forEach((p) => {
      const handleVal =
        memberProfile?.[`${p}_handle`] ?? memberProfile?.[p] ?? '';
      fd.set(`${p}_handle`, handleVal);
    });
    return fd;
  };

  function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleAvatarCropApply(file) {
    setCropSrc(null);
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const result = await uploadAvatarAction(fd);
      if (result?.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleAvatarRemove() {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    setAvatarUploading(true);
    try {
      const result = await removeAvatarAction();
      if (result?.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert('Failed to remove avatar: ' + err.message);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveIdentity(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    setSavingIdentity(true);
    try {
      const result = await updateMemberInfoAction(formData);
      if (result?.error) {
        alert(result.error);
      } else {
        setEditingIdentity(false);
        router.refresh();
      }
    } catch (err) {
      alert('Error updating personal details: ' + err.message);
    } finally {
      setSavingIdentity(false);
    }
  }

  async function handleSaveSkills(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const fd = getBaseProfileFormData();
    fd.set('skills', formData.get('skills') || '');
    fd.set('interests', formData.get('interests') || '');

    setSavingSkills(true);
    try {
      const result = await updateMemberProfileAction(fd);
      if (result?.error) {
        alert(result.error);
      } else {
        setEditingSkills(false);
        router.refresh();
      }
    } catch (err) {
      alert('Error saving skills: ' + err.message);
    } finally {
      setSavingSkills(false);
    }
  }

  async function handleSaveAbout(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const fd = getBaseProfileFormData();
    fd.set('bio', formData.get('bio') || '');
    fd.set('username', formData.get('username') || '');

    setSavingAbout(true);
    try {
      const result = await updateMemberProfileAction(fd);
      if (result?.error) {
        alert(result.error);
      } else {
        setEditingAbout(false);
        router.refresh();
      }
    } catch (err) {
      alert('Error saving about: ' + err.message);
    } finally {
      setSavingAbout(false);
    }
  }

  async function handleSaveHandles(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const fd = getBaseProfileFormData();

    const cpPlatforms = ['codeforces', 'atcoder', 'leetcode', 'codechef'];
    cpPlatforms.forEach((p) => {
      fd.set(`${p}_handle`, formData.get(`${p}_handle`) || '');
    });

    const socialPlatforms = ['github', 'linkedin', 'facebook'];
    socialPlatforms.forEach((p) => {
      fd.set(p, formData.get(`${p}_handle`) || '');
    });

    setSavingHandles(true);
    try {
      const result = await updateMemberProfileAction(fd);
      if (result?.error) {
        alert(result.error);
      } else {
        setEditingHandles(false);
        router.refresh();
      }
    } catch (err) {
      alert('Error saving handles: ' + err.message);
    } finally {
      setSavingHandles(false);
    }
  }

  // Helper function to generate grid cells based on range and platform type
  const generateGridCells = (range) => {
    const cells = [];
    const today = new Date();
    const days = range === '12' ? 364 : range === '6' ? 182 : 30;
    const weeksNeeded = Math.ceil(days / 7);
    const totalCells = weeksNeeded * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (totalCells - 1));

    for (let i = 0; i < totalCells; i++) {
      const curr = new Date(startDate);
      curr.setDate(startDate.getDate() + i);
      const dateStr = curr.toISOString().split('T')[0];

      cells.push({ dateStr, count: activityByDate[dateStr] || 0 });
    }
    return cells;
  };

  const problemSolvingCells = useMemo(() => {
    return generateGridCells(heatmapRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatmapRange, activityByDate]);

  const problemSolvingCols = useMemo(() => {
    const cols = [];
    for (let i = 0; i < problemSolvingCells.length; i += 7) {
      cols.push(problemSolvingCells.slice(i, i + 7));
    }
    return cols;
  }, [problemSolvingCells]);

  const totalProblemSolving = useMemo(() => {
    return problemSolvingCells.reduce((sum, c) => sum + c.count, 0);
  }, [problemSolvingCells]);

  const getHeatmapColor = (count) => {
    if (count === 0)
      return 'bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.01]';
    if (count === 1)
      return 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-900/30';
    if (count === 2)
      return 'bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-700/30';
    if (count <= 4)
      return 'bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/30';
    return 'bg-emerald-400 border border-emerald-300/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]';
  };

  const renderHeatmap = (
    title,
    icon,
    cols,
    totalCount,
    labelColorClass = 'text-[#B6F36B]',
    filterElement = null
  ) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.03] pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="shrink-0">{icon}</span>
              <span className="text-zinc-355 font-mono text-[11px] font-bold tracking-wider uppercase">
                {title}
              </span>
            </div>
            {filterElement}
          </div>
          <span className="text-zinc-555 font-mono text-[10px]">
            Total logs:{' '}
            <strong className={labelColorClass}>{totalCount}</strong>
          </span>
        </div>

        <div className="scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent overflow-x-auto pb-2">
          <div className="flex min-w-[640px] flex-col pt-1 pr-1">
            <div className="flex gap-2">
              <div className="flex flex-1 gap-[3px]">
                {cols.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-[3px]">
                    {col.map((cell, cellIdx) => (
                      <div
                        key={cellIdx}
                        className={`h-[10px] w-[10px] cursor-pointer rounded-sm transition-colors ${getHeatmapColor(cell.count)}`}
                        title={`${cell.dateStr}: ${cell.count} actions`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const totalSolved = userStats?.total_solved ?? 0;
  const easySolved = userStats?.easy_solved ?? 0;
  const mediumSolved = userStats?.medium_solved ?? 0;
  const hardSolved = userStats?.hard_solved ?? 0;
  const pctOf = (n) =>
    totalSolved > 0 ? Math.round((n / totalSolved) * 100) : 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const solvedPercentage = Math.min(
    100,
    Math.round((totalSolved / 1000) * 100)
  );
  const strokeOffset = circumference - (solvedPercentage / 100) * circumference;

  const codingProfiles = useMemo(() => {
    const getPlatformURL = (platformId, handle) => {
      if (!handle) return '#';
      switch (platformId) {
        case 'codeforces':
          return `https://codeforces.com/profile/${handle}`;
        case 'leetcode':
          return `https://leetcode.com/${handle}`;
        case 'atcoder':
          return `https://atcoder.jp/users/${handle}`;
        case 'codechef':
          return `https://www.codechef.com/users/${handle}`;
        case 'github':
          return `https://github.com/${handle}`;
        case 'linkedin':
          return `https://linkedin.com/in/${handle}`;
        case 'facebook':
          return `https://facebook.com/${handle}`;
        default:
          return '#';
      }
    };

    return HANDLE_PLATFORMS.map((p) => {
      const dbHandle =
        memberProfile?.[`${p.id}_handle`] ?? memberProfile?.[p.id];
      const live = handles.find((h) => h.platform?.code === p.id);
      return {
        platform: p.name,
        platformId: p.id,
        handle: dbHandle || 'Not set',
        rating: live?.rating
          ? `${live.rating}${live.max_rating ? ` (max ${live.max_rating})` : ''}`
          : dbHandle
            ? 'Linked'
            : 'Unlinked',
        solved: '',
        color: p.color,
        url: dbHandle ? getPlatformURL(p.id, dbHandle) : '#',
      };
    });
  }, [memberProfile, handles]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'competitive', label: 'Competitive Programming', icon: Trophy },
    { id: 'awards', label: 'Awards & Credentials', icon: Award },
  ];

  return (
    <PageShell className="mx-auto max-w-[1600px] pb-16 text-gray-300 selection:bg-[#7C5CFF]/30">
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onApply={handleAvatarCropApply}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Identity Banner Card */}
      <GlassCard className="relative mb-6 overflow-hidden p-6 sm:p-8">
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-sky-500" />
        {editingIdentity ? (
          <form onSubmit={handleSaveIdentity} className="relative space-y-4">
            <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <User className="size-4 text-[#B6F36B]" />
              <h3 className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                Edit Personal Info
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-gray-400 uppercase">
                  Display Name
                </label>
                <input
                  name="full_name"
                  defaultValue={user?.full_name ?? ''}
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-violet-500/50"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-gray-400 uppercase">
                  Phone Number
                </label>
                <input
                  name="phone"
                  defaultValue={user?.phone ?? ''}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-violet-500/50"
                  placeholder="+880 1XXX XXXXXX"
                  type="tel"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingIdentity(false)}
                className="cursor-pointer rounded-xl border border-white/10 px-3.5 py-2 text-[11px] font-bold text-gray-400 transition hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingIdentity}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#7C5CFF] px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-[#6c4beb]"
              >
                {savingIdentity && (
                  <Loader2 size={12} className="animate-spin" />
                )}
                <span>Save</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-6">
              <div className="group relative shrink-0">
                <Avatar
                  user={user}
                  size="xl"
                  src={
                    user?.avatar_url?.startsWith('/api/image/')
                      ? user.avatar_url
                      : null
                  }
                  name={user?.full_name || 'Member'}
                />
                {avatarUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65 backdrop-blur-sm">
                    <Loader2 className="size-5 animate-spin text-white" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-full bg-black/65 text-white opacity-0 transition-opacity select-none group-hover:opacity-100">
                    <label
                      htmlFor="avatar-file-input"
                      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center"
                    >
                      <Camera size={16} className="text-zinc-200" />
                      <span className="text-zinc-350 text-[9px] font-bold tracking-wider uppercase">
                        Update
                      </span>
                    </label>
                  </div>
                )}
                <input
                  type="file"
                  id="avatar-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  disabled={avatarUploading}
                />
                {user?.avatar_url?.startsWith('/api/image/') &&
                  !avatarUploading && (
                    <button
                      onClick={handleAvatarRemove}
                      title="Remove Photo"
                      className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full border border-white/10 bg-rose-600 text-white shadow-md transition-transform hover:bg-rose-500 active:scale-95"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">
                    {user?.full_name || 'Member'}
                  </h2>
                  <span className="rounded-full border border-[#B6F36B]/25 bg-[#B6F36B]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#B6F36B] uppercase">
                    Verified Member
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-neutral-500">
                  @{memberProfile?.username || 'unset'} · {user?.email || ''}
                </p>
                {user?.phone && (
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                    📞 {user.phone}
                  </p>
                )}
                <div className="flex flex-wrap justify-center gap-4 pt-1 text-xs font-medium text-zinc-500 sm:justify-start">
                  {memberProfile?.department && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-zinc-600" />{' '}
                      {memberProfile.department}
                    </span>
                  )}
                  {memberProfile?.student_id && (
                    <span className="flex items-center gap-1.5">
                      <Hash size={13} className="text-zinc-600" />{' '}
                      {memberProfile.student_id}
                    </span>
                  )}
                  {memberProfile?.academic_session && (
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-zinc-600" /> Session{' '}
                      {memberProfile.academic_session}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setEditingIdentity(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/[0.08]"
              >
                <Pencil size={13} />
                <span>Edit Personal Info</span>
              </button>

              {/* Social links */}
              {memberProfile?.github && (
                <>
                  <div className="hidden h-6 w-[1px] bg-white/[0.08] sm:block" />
                  <a
                    href={getSocialLink('github', memberProfile?.github)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-all hover:border-[#B6F36B]/40 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Github size={14} />
                  </a>
                </>
              )}
              {memberProfile?.linkedin && (
                <a
                  href={getSocialLink('linkedin', memberProfile?.linkedin)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-all hover:border-[#7C5CFF]/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <Linkedin size={14} />
                </a>
              )}
              {memberProfile?.facebook && (
                <a
                  href={getSocialLink('facebook', memberProfile?.facebook)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-all hover:border-blue-500/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <Facebook size={14} />
                </a>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      <div className="space-y-6">
        {/* Quick Stats counters */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e16]/60 p-4">
            <Code2 size={18} className="mb-1 text-[#B6F36B]" />
            <span className="font-mono text-xl font-bold text-white">
              {totalSolved}
            </span>
            <span className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
              Solved Problems
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e16]/60 p-4">
            <Flame size={18} className="mb-1 text-orange-500" />
            <span className="font-mono text-xl font-bold text-white">
              {userStats?.current_streak ?? 0} Days
            </span>
            <span className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
              Current Streak
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e16]/60 p-4">
            <Trophy size={18} className="mb-1 text-yellow-500" />
            <span className="font-mono text-xl font-bold text-white">
              {userStats?.longest_streak ?? 0} Days
            </span>
            <span className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
              Longest Streak
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.05] bg-[#0c0e16]/60 p-4">
            <Award size={18} className="mb-1 text-sky-400" />
            <span className="font-mono text-xl font-bold text-white">
              {contestParticipations.length}
            </span>
            <span className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
              Contests Joined
            </span>
          </div>
        </div>

        {/* Layout Grid columns */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Column details */}
          <div className="space-y-6 lg:col-span-4">
            {/* Tech Stack & Core Focus Area (Merged) */}
            <GlassCard className="space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                <div className="flex items-center gap-2">
                  <Code2 size={16} className="text-[#B6F36B]" />
                  <h3 className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Skills & Focus Areas
                  </h3>
                </div>
                {!editingSkills && (
                  <button
                    onClick={() => setEditingSkills(true)}
                    className="cursor-pointer text-zinc-500 transition hover:text-white"
                    title="Edit Skills"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>

              {editingSkills ? (
                <form onSubmit={handleSaveSkills} className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-gray-400 uppercase">
                      Skills (comma-separated)
                    </label>
                    <input
                      name="skills"
                      defaultValue={
                        memberProfile?.skills
                          ? memberProfile.skills.join(', ')
                          : ''
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500/50"
                      placeholder="C++, Python, React, Next.js..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] text-gray-400 uppercase">
                      Primary Domains (comma-separated)
                    </label>
                    <input
                      name="interests"
                      defaultValue={
                        memberProfile?.interests
                          ? memberProfile.interests.join(', ')
                          : ''
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500/50"
                      placeholder="Competitive Programming, AI/ML..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSkills(false)}
                      className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-gray-400 hover:bg-white/[0.04]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSkills}
                      className="flex items-center gap-1 rounded-lg bg-[#7C5CFF] px-2.5 py-1 text-[10px] font-bold text-white"
                    >
                      {savingSkills && (
                        <Loader2 size={10} className="animate-spin" />
                      )}
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(memberProfile?.skills || []).map((s, i) => (
                        <span
                          key={i}
                          className="rounded border border-[#7C5CFF]/20 bg-[#7C5CFF]/10 px-2 py-0.5 font-mono text-[10.5px] text-[#c4b5fd] uppercase"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.04] pt-4">
                    <span className="mb-2 block font-mono text-[10px] font-bold text-zinc-500 uppercase">
                      Primary Domains
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(memberProfile?.interests || []).map((interest, i) => (
                        <span
                          key={i}
                          className="rounded border border-[#B6F36B]/15 bg-[#B6F36B]/5 px-2 py-0.5 text-[10px] font-semibold text-[#B6F36B]/80 uppercase"
                        >
                          {interest.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </GlassCard>

            {/* Academic Timeline */}
            <GlassCard className="p-5">
              <SectionTitle icon={GraduationCap} label="Academic Timeline" />
              {memberProfile ? (
                <div className="relative space-y-1 border-l border-white/[0.06] pl-4">
                  <div className="absolute top-1.5 left-[-4.5px] h-2 w-2 rounded-full bg-[#B6F36B]" />
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-zinc-200">
                      {memberProfile.department}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      Session {memberProfile.academic_session}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Student ID: {memberProfile.student_id}
                    {memberProfile.semester
                      ? ` · Semester ${memberProfile.semester}`
                      : ''}
                  </div>
                  {memberProfile.cgpa != null && (
                    <div className="font-mono text-[10px] text-[#B6F36B]/80">
                      CGPA: {memberProfile.cgpa}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  No academic details on file yet.
                </p>
              )}
            </GlassCard>
          </div>

          {/* Right Column details */}
          <div className="space-y-6 lg:col-span-8">
            {/* Custom Tab Navigation */}
            <div className="flex gap-1 overflow-x-auto border-b border-white/[0.04]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-[#B6F36B] bg-white/[0.02] text-white'
                        : 'text-zinc-450 border-transparent hover:bg-white/[0.01] hover:text-zinc-200'
                    }`}
                  >
                    <Icon
                      size={14}
                      className={isActive ? 'text-[#B6F36B]' : 'text-zinc-555'}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <>
                      {/* About & Objectives */}
                      <GlassCard className="space-y-4 p-6">
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-[#B6F36B]" />
                            <h3 className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                              About & Objectives
                            </h3>
                          </div>
                          {!editingAbout && (
                            <button
                              onClick={() => setEditingAbout(true)}
                              className="cursor-pointer text-zinc-500 transition hover:text-white"
                              title="Edit About"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>

                        {editingAbout ? (
                          <form
                            onSubmit={handleSaveAbout}
                            className="space-y-4"
                          >
                            <div className="space-y-1">
                              <label className="font-mono text-[10px] text-gray-400 uppercase">
                                Username
                              </label>
                              <input
                                name="username"
                                defaultValue={memberProfile?.username ?? ''}
                                placeholder="your_custom_username"
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-mono text-[10px] text-gray-400 uppercase">
                                Bio / Career Objective
                              </label>
                              <textarea
                                name="bio"
                                defaultValue={memberProfile?.bio ?? ''}
                                placeholder="Tell us about yourself…"
                                rows={4}
                                className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-violet-500/50"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingAbout(false)}
                                className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-gray-400 hover:bg-white/[0.04]"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={savingAbout}
                                className="flex items-center gap-1 rounded-lg bg-[#7C5CFF] px-3 py-1.5 text-[11px] font-bold text-white"
                              >
                                {savingAbout && (
                                  <Loader2 size={11} className="animate-spin" />
                                )}
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="font-sans text-sm leading-relaxed text-zinc-300">
                            {memberProfile?.bio ||
                              'No bio added yet — click the pencil to introduce yourself.'}
                          </p>
                        )}
                      </GlassCard>

                      {/* Three Activity Heatmaps */}
                      <GlassCard className="space-y-8 p-6">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                          <SectionTitle
                            icon={Activity}
                            label="Activity & Contribution Analytics"
                          />
                          <select
                            value={heatmapRange}
                            onChange={(e) => setHeatmapRange(e.target.value)}
                            className="text-zinc-355 cursor-pointer rounded-xl border border-white/[0.06] bg-[#110f15] px-3 py-1.5 font-mono text-xs font-bold tracking-wide hover:bg-[#1a1820] focus:outline-none"
                          >
                            <option value="12">Last 12 Months</option>
                            <option value="6">Last 6 Months</option>
                            <option value="1">Last 30 Days</option>
                          </select>
                        </div>

                        {/* Problem Solving Activity Heatmap (live solve data) */}
                        {renderHeatmap(
                          'Problem Solving Activity',
                          <Code2 size={13} className="text-[#B6F36B]" />,
                          problemSolvingCols,
                          totalProblemSolving,
                          'text-[#B6F36B]'
                        )}

                        {/* Legend */}
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.03] pt-4 font-mono text-[10.5px] text-zinc-500">
                          <span>Less</span>
                          <div className="h-[10px] w-[10px] rounded-sm bg-white/[0.02]" />
                          <div className="h-[10px] w-[10px] rounded-sm bg-emerald-950/70" />
                          <div className="bg-emerald-850/80 h-[10px] w-[10px] rounded-sm" />
                          <div className="h-[10px] w-[10px] rounded-sm bg-emerald-600/90" />
                          <div className="h-[10px] w-[10px] rounded-sm bg-emerald-400" />
                          <span>More</span>
                        </div>
                      </GlassCard>

                      {/* Donut Progress */}
                      <GlassCard className="p-5">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                          <div className="flex-1">
                            <div className="mb-4 flex items-center justify-between">
                              <SectionTitle
                                icon={Code2}
                                label="Problem Solving Metrics"
                              />
                            </div>
                            <p className="max-w-md font-sans text-xs leading-relaxed text-zinc-400">
                              Live statistics aggregated across online judges
                              showing overall problem metrics, easy/medium/hard
                              category distribution, and code performance
                              profiles.
                            </p>
                          </div>

                          <div className="relative flex h-36 shrink-0 items-center justify-center md:mr-6">
                            <svg className="h-32 w-32 -rotate-90 transform">
                              <circle
                                cx="64"
                                cy="64"
                                r={radius}
                                className="stroke-neutral-800"
                                strokeWidth="8"
                                fill="transparent"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r={radius}
                                className="stroke-[#B6F36B] transition-all duration-500"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeOffset}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center text-center">
                              <span className="font-mono text-3xl font-extrabold tracking-tight text-neutral-100">
                                {totalSolved}
                              </span>
                              <span className="mt-0.5 font-mono text-[9px] tracking-widest text-zinc-500 uppercase">
                                Solved
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-4 text-center font-mono text-[10.5px]">
                          <div>
                            <span className="mb-0.5 block text-[9px] text-zinc-500 uppercase">
                              Easy
                            </span>
                            <span className="font-bold text-emerald-400">
                              {pctOf(easySolved)}% ({easySolved})
                            </span>
                          </div>
                          <div className="border-x border-white/[0.04]">
                            <span className="mb-0.5 block text-[9px] text-zinc-500 uppercase">
                              Medium
                            </span>
                            <span className="font-bold text-amber-400">
                              {pctOf(mediumSolved)}% ({mediumSolved})
                            </span>
                          </div>
                          <div>
                            <span className="mb-0.5 block text-[9px] text-zinc-500 uppercase">
                              Hard
                            </span>
                            <span className="font-bold text-rose-500">
                              {pctOf(hardSolved)}% ({hardSolved})
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    </>
                  )}

                  {/* TAB: COMPETITIVE PROGRAMMING */}

                  {activeTab === 'competitive' && (
                    <>
                      {/* Coding Handles card */}
                      <GlassCard className="space-y-4 p-5">
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                          <div className="flex items-center gap-2">
                            <Globe size={16} className="text-[#B6F36B]" />
                            <h3 className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                              Platform Standings & Handles
                            </h3>
                          </div>
                          {!editingHandles && (
                            <button
                              onClick={() => setEditingHandles(true)}
                              className="cursor-pointer text-zinc-500 transition hover:text-white"
                              title="Edit Handles"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>

                        {editingHandles ? (
                          <form
                            onSubmit={handleSaveHandles}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              {HANDLE_PLATFORMS.map((p) => (
                                <div key={p.id} className="space-y-1">
                                  <label className="block font-mono text-[10px] text-gray-400 uppercase">
                                    {p.name} Handle
                                  </label>
                                  <input
                                    name={`${p.id}_handle`}
                                    defaultValue={
                                      memberProfile?.[`${p.id}_handle`] ??
                                      memberProfile?.[p.id] ??
                                      ''
                                    }
                                    placeholder={`${p.id}_username`}
                                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 font-mono text-[12px] text-white outline-none focus:border-violet-500/50"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingHandles(false)}
                                className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-gray-400 hover:bg-white/[0.04]"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={savingHandles}
                                className="flex items-center gap-1 rounded-lg bg-[#7C5CFF] px-3 py-1.5 text-[11px] font-bold text-white"
                              >
                                {savingHandles && (
                                  <Loader2 size={11} className="animate-spin" />
                                )}
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {codingProfiles.map((h, i) => (
                              <a
                                key={i}
                                href={h.url}
                                target={h.url !== '#' ? '_blank' : undefined}
                                rel="noreferrer"
                                className="group flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5 transition-all duration-200 hover:border-[#B6F36B]/30 hover:bg-white/[0.04]"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                                    style={{
                                      backgroundColor: h.color + '22',
                                      border: `1px solid ${h.color}44`,
                                    }}
                                  >
                                    {h.platform.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-neutral-455 text-xs font-semibold">
                                      {h.platform}
                                    </div>
                                    <div className="text-sm font-bold text-neutral-200 group-hover:text-white">
                                      {h.handle}
                                    </div>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div
                                    className="font-mono text-xs font-bold"
                                    style={{ color: h.color }}
                                  >
                                    {h.rating}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">
                                    {h.solved}
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </GlassCard>

                      {/* Rated Contests */}
                      <GlassCard className="p-6">
                        <SectionTitle
                          icon={Trophy}
                          label="Contest Participation"
                        />
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-mono text-xs">
                            <thead>
                              <tr className="border-b border-white/[0.06] text-zinc-500">
                                <th className="px-1 py-2.5 text-[9px] font-bold tracking-wider uppercase">
                                  Platform
                                </th>
                                <th className="px-1 py-2.5 text-[9px] font-bold tracking-wider uppercase">
                                  Contest Title
                                </th>
                                <th className="px-1 py-2.5 text-right text-[9px] font-bold tracking-wider uppercase">
                                  Rank
                                </th>
                                <th className="px-1 py-2.5 text-right text-[9px] font-bold tracking-wider uppercase">
                                  Score
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {contestParticipations.length === 0 && (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="py-6 text-center text-zinc-500"
                                  >
                                    No contest participation recorded yet.
                                  </td>
                                </tr>
                              )}
                              {contestParticipations.map((c, i) => (
                                <tr
                                  key={c.id || i}
                                  className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.01]"
                                >
                                  <td className="text-zinc-350 px-1 py-3 font-bold">
                                    {c.contests?.platform || '—'}
                                  </td>
                                  <td className="px-1 py-3 text-zinc-200">
                                    {c.contests?.title || 'Contest'}
                                  </td>
                                  <td className="text-zinc-350 px-1 py-3 text-right">
                                    {c.rank ?? '—'}
                                  </td>
                                  <td className="text-emerald-450 px-1 py-3 text-right font-bold">
                                    {c.score ?? '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </GlassCard>
                    </>
                  )}

                  {/* TAB 4: AWARDS & CREDENTIALS */}
                  {activeTab === 'awards' && (
                    <div className="flex flex-col gap-6">
                      {/* Awards */}
                      <GlassCard className="p-5">
                        <SectionTitle
                          icon={Trophy}
                          label="Honors & Achievements"
                        />
                        <div className="space-y-4">
                          {memberAchievements.length === 0 && (
                            <p className="text-xs text-zinc-500">
                              No achievements recorded yet.
                            </p>
                          )}
                          {memberAchievements.map((row, i) => (
                            <div
                              key={row.id || i}
                              className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.03] bg-white/[0.01] p-3 text-xs"
                            >
                              <div>
                                <div className="font-bold text-zinc-200">
                                  {row.achievements?.title}
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium text-zinc-500">
                                  {[
                                    row.achievements?.result,
                                    row.achievements?.category,
                                    row.achievements?.team_name,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </div>
                              </div>
                              <span className="shrink-0 font-mono text-[10.5px] text-zinc-500">
                                {row.achievements?.achievement_date
                                  ? new Date(
                                      row.achievements.achievement_date
                                    ).toLocaleDateString('en-US', {
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : row.achievements?.year || ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      {/* Certificates */}
                      <GlassCard className="p-5">
                        <SectionTitle
                          icon={Award}
                          label="Professional Certifications"
                        />
                        <div className="space-y-4">
                          {certificates.length === 0 && (
                            <p className="text-xs text-zinc-500">
                              No certificates issued yet.
                            </p>
                          )}
                          {certificates.map((item, i) => (
                            <div
                              key={item.id || i}
                              className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.03] bg-white/[0.01] p-3 text-xs"
                            >
                              <div>
                                <div className="font-bold text-zinc-200">
                                  {item.title}
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium text-zinc-500">
                                  {[
                                    item.certificate_type,
                                    item.certificate_number,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </div>
                              </div>
                              <span className="text-zinc-555 shrink-0 font-mono text-[10.5px]">
                                {item.issue_date
                                  ? new Date(
                                      item.issue_date
                                    ).toLocaleDateString('en-US', {
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
