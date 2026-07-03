/**
 * @file Member profile client dashboard component.
 * Redesigned for FHD screens using high-fidelity glassmorphic sections matching the public profile view.
 * Supports viewing the full mock profile and toggling to the edit form.
 * Uses a tabbed layout, unified styling, and reduces duplicate/redundant data.
 * @module MemberProfileClient
 */

'use client';

import { useState, useTransition, useMemo, useRef, useCallback, useEffect } from 'react';
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
  Sparkles,
  GraduationCap,
  BookOpen,
  Hash,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  FileText,
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
import { MOCK_PROFILE } from '@/app/user/[username]/_components/mockData';

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
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={16} className="text-[#B6F36B]" />}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
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

export default function MemberProfileClient({ user, memberProfile }) {
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
  const [dsaPlatform, setDsaPlatform] = useState('leetcode');
  const [heatmapRange, setHeatmapRange] = useState('12');
  const [dailyFilter, setDailyFilter] = useState('all');

  const profile = MOCK_PROFILE;

  const getBaseProfileFormData = () => {
    const fd = new FormData();
    fd.set('username', memberProfile?.username || '');
    fd.set('bio', memberProfile?.bio || '');
    fd.set('skills', memberProfile?.skills ? memberProfile.skills.join(', ') : '');
    fd.set('interests', memberProfile?.interests ? memberProfile.interests.join(', ') : '');
    fd.set('linkedin', memberProfile?.linkedin || '');
    fd.set('github', memberProfile?.github || '');
    fd.set('facebook', memberProfile?.facebook || '');
    fd.set('x_handle', memberProfile?.x_handle || '');
    
    const platforms = [
      'codeforces', 'atcoder', 'leetcode', 'codechef', 'hackerrank', 
      'spoj', 'cses', 'vjudge', 'toph', 'lightoj', 'uva', 
      'beecrowd', 'facebookhackercup'
    ];
    platforms.forEach(p => {
      const handleVal = memberProfile?.[`${p}_handle`] ?? memberProfile?.[p] ?? '';
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
    cpPlatforms.forEach(p => {
      fd.set(`${p}_handle`, formData.get(`${p}_handle`) || '');
    });

    const socialPlatforms = ['github', 'linkedin', 'facebook'];
    socialPlatforms.forEach(p => {
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
  const generateGridCells = (range, platformType) => {
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

      let count = 0;
      if (platformType === 'problems') {
        count = (profile.activity.leetcode[dateStr] || 0) +
                (profile.activity.codeforces[dateStr] || 0) +
                (profile.activity.codechef[dateStr] || 0) +
                (profile.activity.atcoder[dateStr] || 0);
      } else if (platformType === 'daily') {
        if (dailyFilter === 'all') {
          count = (profile.activity.todolist?.[dateStr] || 0) +
                  (profile.activity.courseWatchTime?.[dateStr] || 0);
        } else if (dailyFilter === 'todolist') {
          count = profile.activity.todolist?.[dateStr] || 0;
        } else if (dailyFilter === 'courseWatchTime') {
          count = profile.activity.courseWatchTime?.[dateStr] || 0;
        }
      } else if (platformType === 'github') {
        count = profile.activity.github[dateStr] || 0;
      }

      cells.push({ dateStr, count });
    }
    return cells;
  };

  const problemSolvingCells = useMemo(() => {
    return generateGridCells(heatmapRange, 'problems');
  }, [heatmapRange]);

  const dailyActivityCells = useMemo(() => {
    return generateGridCells(heatmapRange, 'daily');
  }, [heatmapRange, dailyFilter]);

  const githubCells = useMemo(() => {
    return generateGridCells(heatmapRange, 'github');
  }, [heatmapRange]);

  const problemSolvingCols = useMemo(() => {
    const cols = [];
    for (let i = 0; i < problemSolvingCells.length; i += 7) {
      cols.push(problemSolvingCells.slice(i, i + 7));
    }
    return cols;
  }, [problemSolvingCells]);

  const dailyActivityCols = useMemo(() => {
    const cols = [];
    for (let i = 0; i < dailyActivityCells.length; i += 7) {
      cols.push(dailyActivityCells.slice(i, i + 7));
    }
    return cols;
  }, [dailyActivityCells]);

  const githubCols = useMemo(() => {
    const cols = [];
    for (let i = 0; i < githubCells.length; i += 7) {
      cols.push(githubCells.slice(i, i + 7));
    }
    return cols;
  }, [githubCells]);

  const totalProblemSolving = useMemo(() => {
    return problemSolvingCells.reduce((sum, c) => sum + c.count, 0);
  }, [problemSolvingCells]);

  const totalDailyActivity = useMemo(() => {
    return dailyActivityCells.reduce((sum, c) => sum + c.count, 0);
  }, [dailyActivityCells]);

  const totalGithubContributions = useMemo(() => {
    return githubCells.reduce((sum, c) => sum + c.count, 0);
  }, [githubCells]);

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.01]';
    if (count === 1) return 'bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-900/30';
    if (count === 2) return 'bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-700/30';
    if (count <= 4) return 'bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/30';
    return 'bg-emerald-400 border border-emerald-300/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]';
  };

  const renderHeatmap = (title, icon, cols, totalCount, labelColorClass = 'text-[#B6F36B]', filterElement = null) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.03] pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="shrink-0">{icon}</span>
              <span className="text-[11px] font-bold font-mono text-zinc-355 tracking-wider uppercase">{title}</span>
            </div>
            {filterElement}
          </div>
          <span className="text-[10px] font-mono text-zinc-555">
            Total logs: <strong className={labelColorClass}>{totalCount}</strong>
          </span>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
          <div className="min-w-[640px] flex flex-col pt-1 pr-1">
            <div className="flex gap-2">
              <div className="flex-1 flex gap-[3px]">
                {cols.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-[3px]">
                    {col.map((cell, cellIdx) => (
                      <div
                        key={cellIdx}
                        className={`w-[10px] h-[10px] rounded-sm transition-colors cursor-pointer ${getHeatmapColor(cell.count)}`}
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

  const dsaStats = profile.codingProfiles.find(p => p.platform.toLowerCase() === dsaPlatform) || profile.codingProfiles[0];
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const solvedPercentage = Math.min(100, Math.round((dsaStats.solved / 1000) * 100));
  const strokeOffset = circumference - (solvedPercentage / 100) * circumference;

  const codingProfiles = useMemo(() => {
    const getPlatformURL = (platformId, handle) => {
      if (!handle) return '#';
      switch (platformId) {
        case 'codeforces': return `https://codeforces.com/profile/${handle}`;
        case 'leetcode': return `https://leetcode.com/${handle}`;
        case 'atcoder': return `https://atcoder.jp/users/${handle}`;
        case 'codechef': return `https://www.codechef.com/users/${handle}`;
        case 'github': return `https://github.com/${handle}`;
        case 'linkedin': return `https://linkedin.com/in/${handle}`;
        case 'facebook': return `https://facebook.com/${handle}`;
        default: return '#';
      }
    };

    return HANDLE_PLATFORMS.map((p) => {
      const dbHandle = memberProfile?.[`${p.id}_handle`] ?? memberProfile?.[p.id];
      return {
        platform: p.name,
        platformId: p.id,
        handle: dbHandle || 'Not set',
        rating: dbHandle ? 'Linked' : 'Unlinked',
        solved: dbHandle ? 'Syncing' : '—',
        color: p.color,
        url: dbHandle ? getPlatformURL(p.id, dbHandle) : '#',
      };
    });
  }, [memberProfile]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'projects', label: 'Projects & Experience', icon: Briefcase },
    { id: 'competitive', label: 'Competitive Programming', icon: Trophy },
    { id: 'awards', label: 'Awards & Credentials', icon: Award },
  ];

  return (
    <PageShell className="text-gray-300 selection:bg-[#7C5CFF]/30 max-w-[1600px] mx-auto pb-16">
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onApply={handleAvatarCropApply}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Identity Banner Card */}
      <GlassCard className="relative overflow-hidden p-6 sm:p-8 mb-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-sky-500" />
        {editingIdentity ? (
          <form onSubmit={handleSaveIdentity} className="relative space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-3">
              <User className="text-[#B6F36B] size-4" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                Edit Personal Info
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono uppercase">Display Name</label>
                <input
                  name="full_name"
                  defaultValue={user?.full_name ?? ''}
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-violet-500/50"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-mono uppercase">Phone Number</label>
                <input
                  name="phone"
                  defaultValue={user?.phone ?? ''}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-violet-500/50"
                  placeholder="+880 1XXX XXXXXX"
                  type="tel"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setEditingIdentity(false)}
                className="px-3.5 py-2 border border-white/10 rounded-xl text-[11px] font-bold text-gray-400 hover:bg-white/[0.04] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingIdentity}
                className="px-3.5 py-2 bg-[#7C5CFF] rounded-xl text-[11px] font-bold text-white hover:bg-[#6c4beb] transition flex items-center gap-1.5 cursor-pointer"
              >
                {savingIdentity && <Loader2 size={12} className="animate-spin" />}
                <span>Save</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative group shrink-0">
                <Avatar
                  user={user}
                  size="xl"
                  src={user?.avatar_url?.startsWith('/api/image/') ? user.avatar_url : null}
                  name={user?.full_name || profile.name}
                />
                {avatarUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/65 backdrop-blur-sm">
                    <Loader2 className="size-5 animate-spin text-white" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white gap-1 select-none">
                    <label htmlFor="avatar-file-input" className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                      <Camera size={16} className="text-zinc-200" />
                      <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-350">Update</span>
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
                {user?.avatar_url?.startsWith('/api/image/') && !avatarUploading && (
                  <button
                    onClick={handleAvatarRemove}
                    title="Remove Photo"
                    className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md border border-white/10 transition-transform active:scale-95"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">{user?.full_name || profile.name}</h2>
                  <span className="bg-[#B6F36B]/15 border border-[#B6F36B]/25 text-[#B6F36B] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    Verified Member
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-mono mt-1">@{memberProfile?.username || profile.username} · {user?.email || profile.email}</p>
                {user?.phone && (
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">📞 {user.phone}</p>
                )}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-1 text-xs text-zinc-550 font-medium">
                  <span className="flex items-center gap-1.5"><MapPin size={13} className="text-zinc-600" /> {profile.location}</span>
                  <span className="flex items-center gap-1.5"><GraduationCap size={13} className="text-zinc-600" /> {profile.university}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => alert('Compiling latest Academic CV PDF document...')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 hover:bg-[#7C5CFF]/25 hover:border-[#7C5CFF]/50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <FileText size={13} className="text-[#B6F36B]" />
                <span>Download CV</span>
              </button>
              <button
                onClick={() => setEditingIdentity(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Pencil size={13} />
                <span>Edit Personal Info</span>
              </button>

              {/* Social links */}
              {(memberProfile?.github || profile.socials.github) && (
                <>
                  <div className="hidden sm:block h-6 w-[1px] bg-white/[0.08]" />
                  <a
                    href={getSocialLink('github', memberProfile?.github || profile.socials.github)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#B6F36B]/40 hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-all"
                  >
                    <Github size={14} />
                  </a>
                </>
              )}
              {(memberProfile?.linkedin || profile.socials.linkedin) && (
                <a
                  href={getSocialLink('linkedin', memberProfile?.linkedin || profile.socials.linkedin)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#7C5CFF]/40 hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-all"
                >
                  <Linkedin size={14} />
                </a>
              )}
              {(memberProfile?.facebook || profile.socials.facebook) && (
                <a
                  href={getSocialLink('facebook', memberProfile?.facebook || profile.socials.facebook)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/40 hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-all"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
            <Code2 size={18} className="text-[#B6F36B] mb-1" />
            <span className="text-xl font-bold font-mono text-white">{profile.quickStats.totalSolved}</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-550 font-mono">Solved Problems</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
            <Flame size={18} className="text-orange-500 mb-1" />
            <span className="text-xl font-bold font-mono text-white">{profile.quickStats.currentStreak} Days</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-550 font-mono">Current Streak</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
            <Trophy size={18} className="text-yellow-500 mb-1" />
            <span className="text-xl font-bold font-mono text-white">{profile.quickStats.longestStreak} Days</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-550 font-mono">Longest Streak</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-[#0c0e16]/60 border border-white/[0.05] rounded-2xl">
            <Award size={18} className="text-sky-400 mb-1" />
            <span className="text-xl font-bold font-mono text-white">{profile.quickStats.totalContests}</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-550 font-mono">Contests Rated</span>
          </div>
        </div>

        {/* Layout Grid columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column details */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Tech Stack & Core Focus Area (Merged) */}
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                <div className="flex items-center gap-2">
                  <Code2 size={16} className="text-[#B6F36B]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    Skills & Focus Areas
                  </h3>
                </div>
                {!editingSkills && (
                  <button
                    onClick={() => setEditingSkills(true)}
                    className="text-zinc-500 hover:text-white transition cursor-pointer"
                    title="Edit Skills"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>

              {editingSkills ? (
                <form onSubmit={handleSaveSkills} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-mono uppercase">Skills (comma-separated)</label>
                    <input
                      name="skills"
                      defaultValue={memberProfile?.skills ? memberProfile.skills.join(', ') : ''}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500/50"
                      placeholder="C++, Python, React, Next.js..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-mono uppercase">Primary Domains (comma-separated)</label>
                    <input
                      name="interests"
                      defaultValue={memberProfile?.interests ? memberProfile.interests.join(', ') : ''}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500/50"
                      placeholder="Competitive Programming, AI/ML..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingSkills(false)}
                      className="px-2.5 py-1 border border-white/10 rounded-lg text-[10px] text-gray-400 hover:bg-white/[0.04]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSkills}
                      className="px-2.5 py-1 bg-[#7C5CFF] rounded-lg text-[10px] text-white font-bold flex items-center gap-1"
                    >
                      {savingSkills && <Loader2 size={10} className="animate-spin" />}
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(memberProfile?.skills && memberProfile.skills.length > 0 ? memberProfile.skills : profile.skills).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10.5px] font-mono rounded bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 text-[#c4b5fd] uppercase">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.04] pt-4">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block mb-2">Primary Domains</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(memberProfile?.interests && memberProfile.interests.length > 0 ? memberProfile.interests : profile.areasOfInterest).map((interest, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#B6F36B]/5 border border-[#B6F36B]/15 text-[#B6F36B]/80 uppercase">
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
              <div className="space-y-4">
                {profile.education.map((edu, i) => (
                  <div key={i} className="relative pl-4 border-l border-white/[0.06] last:pb-0 pb-4 space-y-1">
                    <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-[#B6F36B]" />
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-bold text-zinc-200">{edu.degree}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">{edu.period}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{edu.institution}</div>
                    <div className="text-[10px] font-mono text-[#B6F36B]/80">{edu.result}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Contacts & References (Merged & Collapsed) */}
            <GlassCard className="p-5 space-y-4">
              <SectionTitle icon={User} label="References" />
              <div className="space-y-3">
                {profile.references.map((ref, i) => (
                  <div key={i} className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl space-y-1 text-xs">
                    <div className="font-bold text-neutral-200">{ref.name}</div>
                    <div className="text-[10px] text-zinc-550">{ref.designation} · {ref.institution}</div>
                    <div className="text-[10px] font-mono text-[#7C5CFF] hover:underline cursor-pointer">{ref.email}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Hobbies & Extracurriculars (Merged) */}
            <GlassCard className="p-5 space-y-4">
              <SectionTitle icon={Sparkles} label="Interests & Activities" />
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block mb-2">Extracurricular Roles</span>
                <ul className="space-y-1.5 text-[11px] text-zinc-400 list-disc pl-4 leading-relaxed">
                  {profile.extracurriculars.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-white/[0.04] pt-4">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block mb-2">Hobbies</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.hobbies.map((hobby, i) => (
                    <span key={i} className="px-2.5 py-0.5 text-[10.5px] rounded bg-zinc-800/40 border border-zinc-700/20 text-zinc-300">
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>

          </div>

          {/* Right Column details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Custom Tab Navigation */}
            <div className="flex border-b border-white/[0.04] gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-[#B6F36B] text-white bg-white/[0.02]'
                        : 'border-transparent text-zinc-450 hover:text-zinc-200 hover:bg-white/[0.01]'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-[#B6F36B]' : 'text-zinc-555'} />
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
                      <GlassCard className="p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-[#B6F36B]" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                              About & Objectives
                            </h3>
                          </div>
                          {!editingAbout && (
                            <button
                              onClick={() => setEditingAbout(true)}
                              className="text-zinc-500 hover:text-white transition cursor-pointer"
                              title="Edit About"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>

                        {editingAbout ? (
                          <form onSubmit={handleSaveAbout} className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono uppercase">Username</label>
                              <input
                                name="username"
                                defaultValue={memberProfile?.username ?? ''}
                                placeholder="your_custom_username"
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-400 font-mono uppercase">Bio / Career Objective</label>
                              <textarea
                                name="bio"
                                defaultValue={memberProfile?.bio ?? ''}
                                placeholder="Tell us about yourself…"
                                rows={4}
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-white outline-none focus:border-violet-500/50 resize-none"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingAbout(false)}
                                className="px-3 py-1.5 border border-white/10 rounded-lg text-[11px] text-gray-400 hover:bg-white/[0.04]"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={savingAbout}
                                className="px-3 py-1.5 bg-[#7C5CFF] rounded-lg text-[11px] text-white font-bold flex items-center gap-1"
                              >
                                {savingAbout && <Loader2 size={11} className="animate-spin" />}
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                            {memberProfile?.bio || profile.careerObjective}
                          </p>
                        )}
                      </GlassCard>

                      {/* Three Activity Heatmaps */}
                      <GlassCard className="p-6 space-y-8">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                          <SectionTitle icon={Activity} label="Activity & Contribution Analytics" />
                          <select
                            value={heatmapRange}
                            onChange={(e) => setHeatmapRange(e.target.value)}
                            className="bg-[#110f15] hover:bg-[#1a1820] text-zinc-355 border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer font-mono font-bold tracking-wide"
                          >
                            <option value="12">Last 12 Months</option>
                            <option value="6">Last 6 Months</option>
                            <option value="1">Last 30 Days</option>
                          </select>
                        </div>

                        {/* 1. Daily Platform Activity Heatmap */}
                        {renderHeatmap(
                          'Daily Platform Activity',
                          <Activity size={13} className="text-[#7C5CFF]" />,
                          dailyActivityCols,
                          totalDailyActivity,
                          'text-[#7C5CFF]',
                          <select
                            value={dailyFilter}
                            onChange={(e) => setDailyFilter(e.target.value)}
                            className="bg-[#110f15] hover:bg-[#1a1820] text-zinc-400 border border-white/[0.06] rounded-xl px-2.5 py-1 text-[10px] focus:outline-none cursor-pointer font-mono font-bold tracking-wide"
                          >
                            <option value="all">All Daily Activity</option>
                            <option value="todolist">To-Do List</option>
                            <option value="courseWatchTime">Course Watch Time</option>
                          </select>
                        )}

                        {/* 2. Problem Solving Activity Heatmap */}
                        {renderHeatmap('Problem Solving Activity', <Code2 size={13} className="text-[#B6F36B]" />, problemSolvingCols, totalProblemSolving, 'text-[#B6F36B]')}

                        {/* 3. GitHub Contributions Heatmap */}
                        {renderHeatmap('GitHub Contributions', <Github size={13} className="text-sky-400" />, githubCols, totalGithubContributions, 'text-sky-400')}

                        {/* Legend */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-white/[0.03] text-[10.5px] font-mono text-zinc-550">
                          <span>Less</span>
                          <div className="w-[10px] h-[10px] rounded-sm bg-white/[0.02]" />
                          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-950/70" />
                          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-850/80" />
                          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-600/90" />
                          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-400" />
                          <span>More</span>
                        </div>
                      </GlassCard>

                      {/* Donut Progress */}
                      <GlassCard className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                              <SectionTitle icon={Code2} label="Problem Solving Metrics" />
                              <select
                                value={dsaPlatform}
                                onChange={(e) => setDsaPlatform(e.target.value)}
                                className="bg-[#110f15] hover:bg-[#1a1820] text-zinc-200 border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer font-mono font-bold tracking-wide"
                              >
                                <option value="leetcode">LeetCode</option>
                                <option value="codeforces">Codeforces</option>
                                <option value="codechef">CodeChef</option>
                                <option value="atcoder">AtCoder</option>
                              </select>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-md">
                              Live statistics aggregated across online judges showing overall problem metrics, easy/medium/hard category distribution, and code performance profiles.
                            </p>
                          </div>

                          <div className="flex justify-center items-center relative h-36 shrink-0 md:mr-6">
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle cx="64" cy="64" r={radius} className="stroke-neutral-800" strokeWidth="8" fill="transparent" />
                              <circle cx="64" cy="64" r={radius} className="stroke-[#B6F36B] transition-all duration-500" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeOffset} strokeLinecap="round" />
                            </svg>
                            <div className="absolute flex flex-col justify-center items-center text-center">
                              <span className="text-3xl font-extrabold font-mono text-neutral-100 tracking-tight">{dsaStats.solved}</span>
                              <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 font-mono">Solved</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-4 mt-4 text-center font-mono text-[10.5px]">
                          <div>
                            <span className="block text-zinc-500 uppercase text-[9px] mb-0.5">Easy</span>
                            <span className="text-emerald-400 font-bold">40% solved</span>
                          </div>
                          <div className="border-x border-white/[0.04]">
                            <span className="block text-zinc-500 uppercase text-[9px] mb-0.5">Medium</span>
                            <span className="text-amber-400 font-bold">50% solved</span>
                          </div>
                          <div>
                            <span className="block text-zinc-500 uppercase text-[9px] mb-0.5">Hard</span>
                            <span className="text-rose-500 font-bold">10% solved</span>
                          </div>
                        </div>
                      </GlassCard>
                    </>
                  )}

                  {/* TAB 2: PROJECTS & EXPERIENCE */}
                  {activeTab === 'projects' && (
                    <>
                      {/* Showcase Projects */}
                      <GlassCard className="p-6">
                        <SectionTitle icon={Award} label="Computational Projects" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {profile.projects.map((p, i) => (
                            <div key={i} className="p-4 bg-white/[0.01] border border-white/[0.03] hover:border-[#B6F36B]/20 rounded-xl space-y-3 flex flex-col justify-between hover:bg-white/[0.02] transition-all">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-zinc-200">{p.title}</span>
                                  <span className="text-[10px] font-mono font-bold text-yellow-500">★ {p.stars} stars</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{p.desc}</p>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.02] text-[10px] font-mono">
                                <div className="flex gap-1">
                                  {p.tags.map((t, idx) => (
                                    <span key={idx} className="bg-white/[0.03] px-2 py-0.5 rounded text-zinc-500">{t}</span>
                                  ))}
                                </div>
                                <a href={p.url} className="text-[#7C5CFF] hover:underline flex items-center gap-0.5">
                                  <span>Source</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      {/* Professional Timeline */}
                      <GlassCard className="p-6">
                        <SectionTitle icon={Briefcase} label="Professional & Research Timeline" />
                        <div className="space-y-6">
                          {profile.workExperience.map((exp, i) => (
                            <div key={i} className="relative pl-5 border-l border-white/[0.06] last:pb-0 pb-6 space-y-2">
                              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#7C5CFF] border border-[#030408]" />
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                <div>
                                  <span className="font-bold text-sm text-zinc-200">{exp.role}</span>
                                  <span className="text-zinc-550 mx-1.5">@</span>
                                  <span className="text-[#B6F36B] font-semibold">{exp.company}</span>
                                  <span className="ml-2 bg-white/[0.03] border border-white/[0.08] px-2 py-0.5 rounded text-[9px] font-mono uppercase text-zinc-400">{exp.type}</span>
                                </div>
                                <span className="text-zinc-550 font-mono text-[11px]">{exp.period}</span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed font-sans">{exp.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {exp.skills.map((s, idx) => (
                                  <span key={idx} className="bg-[#7C5CFF]/5 border border-[#7C5CFF]/15 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400">{s}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      {/* Research Experience */}
                      <GlassCard className="p-6">
                        <SectionTitle icon={GraduationCap} label="Research Fellowships" />
                        <div className="space-y-6">
                          {profile.research.map((res, i) => (
                            <div key={i} className="relative pl-5 border-l border-white/[0.06] last:pb-0 pb-6 space-y-2">
                              <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#7C5CFF] border border-[#030408]" />
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                <div>
                                  <span className="font-bold text-sm text-zinc-200">{res.role}</span>
                                  <span className="text-zinc-555 mx-1.5">@</span>
                                  <span className="text-[#B6F36B] font-semibold">{res.institution}</span>
                                </div>
                                <span className="text-zinc-550 font-mono text-[11px]">{res.period}</span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed font-sans">{res.description}</p>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      {/* Research Publications */}
                      <GlassCard className="p-6">
                        <SectionTitle icon={Award} label="Scholarly Publications" />
                        <div className="space-y-4">
                          {profile.publications.map((pub, i) => (
                            <div key={i} className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl text-xs space-y-1">
                              <div className="flex justify-between items-start gap-4">
                                <span className="font-bold text-zinc-200">{pub.title}</span>
                                <a href={pub.url} target="_blank" rel="noreferrer" className="text-[#7C5CFF] hover:underline shrink-0">Link</a>
                              </div>
                              <div className="text-zinc-455 font-mono text-[11px]">Journal: {pub.journal} · Date: {pub.date}</div>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </>
                  )}

                  {/* TAB 3: COMPETITIVE PROGRAMMING */}
                  {activeTab === 'competitive' && (
                    <>
                      {/* Coding Handles card */}
                      <GlassCard className="p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                          <div className="flex items-center gap-2">
                            <Globe size={16} className="text-[#B6F36B]" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                              Platform Standings & Handles
                            </h3>
                          </div>
                          {!editingHandles && (
                            <button
                              onClick={() => setEditingHandles(true)}
                              className="text-zinc-500 hover:text-white transition cursor-pointer"
                              title="Edit Handles"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>

                        {editingHandles ? (
                          <form onSubmit={handleSaveHandles} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {HANDLE_PLATFORMS.map((p) => (
                                <div key={p.id} className="space-y-1">
                                  <label className="block text-[10px] text-gray-400 font-mono uppercase">{p.name} Handle</label>
                                  <input
                                    name={`${p.id}_handle`}
                                    defaultValue={memberProfile?.[`${p.id}_handle`] ?? memberProfile?.[p.id] ?? ''}
                                    placeholder={`${p.id}_username`}
                                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 font-mono text-[12px] text-white outline-none focus:border-violet-500/50"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingHandles(false)}
                                className="px-3 py-1.5 border border-white/10 rounded-lg text-[11px] text-gray-400 hover:bg-white/[0.04]"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={savingHandles}
                                className="px-3 py-1.5 bg-[#7C5CFF] rounded-lg text-[11px] text-white font-bold flex items-center gap-1"
                              >
                                {savingHandles && <Loader2 size={11} className="animate-spin" />}
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {codingProfiles.map((h, i) => (
                              <a
                                key={i}
                                href={h.url}
                                target={h.url !== '#' ? '_blank' : undefined}
                                rel="noreferrer"
                                className="group flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-[#B6F36B]/30 hover:bg-white/[0.04] transition-all duration-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                                    style={{ backgroundColor: h.color + '22', border: `1px solid ${h.color}44` }}
                                  >
                                    {h.platform.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-xs text-neutral-455 font-semibold">{h.platform}</div>
                                    <div className="text-sm font-bold text-neutral-200 group-hover:text-white">{h.handle}</div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-mono font-bold" style={{ color: h.color }}>{h.rating}</div>
                                  <div className="text-[10px] text-zinc-550">{h.solved}</div>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </GlassCard>

                      {/* Rated Contests */}
                      <GlassCard className="p-6">
                        <SectionTitle icon={Trophy} label="Online Rated Contests" />
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs font-mono text-left">
                            <thead>
                              <tr className="border-b border-white/[0.06] text-zinc-550">
                                <th className="py-2.5 px-1 text-[9px] uppercase tracking-wider font-bold">Platform</th>
                                <th className="py-2.5 px-1 text-[9px] uppercase tracking-wider font-bold">Contest Title</th>
                                <th className="py-2.5 px-1 text-right text-[9px] uppercase tracking-wider font-bold">Rank</th>
                                <th className="py-2.5 px-1 text-right text-[9px] uppercase tracking-wider font-bold">Delta</th>
                              </tr>
                            </thead>
                            <tbody>
                              {profile.contests.map((c, i) => (
                                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                                  <td className="py-3 px-1 font-bold text-zinc-350">{c.host}</td>
                                  <td className="py-3 px-1 text-zinc-200">{c.name}</td>
                                  <td className="py-3 px-1 text-right text-zinc-350">{c.rank}</td>
                                  <td className="py-3 px-1 text-right text-emerald-450 font-bold">{c.rating}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </GlassCard>

                      {/* Offline Competitive Records */}
                      <GlassCard className="p-6">
                        <SectionTitle icon={Award} label="Championships & Offline Contests" />
                        <div className="space-y-4">
                          {profile.offlineParticipation.map((item, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-xl text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-zinc-200">{item.event}</span>
                                  <span className="bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#c4b5fd] px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold">{item.type}</span>
                                </div>
                                <div className="text-[10px] text-zinc-550 font-medium">Team: {item.team} · Roles: {item.role}</div>
                              </div>
                              <span className="text-emerald-450 font-bold shrink-0 text-right sm:text-left">{item.achievement}</span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </>
                  )}

                  {/* TAB 4: AWARDS & CREDENTIALS */}
                  {activeTab === 'awards' && (
                    <div className="flex flex-col gap-6">
                      {/* Awards */}
                      <GlassCard className="p-5">
                        <SectionTitle icon={Trophy} label="Honors & Achievements" />
                        <div className="space-y-4">
                          {profile.achievements.map((item, i) => (
                            <div key={i} className="flex justify-between items-start gap-4 p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-xs">
                              <div>
                                <div className="font-bold text-zinc-200">{item.title}</div>
                                <div className="text-[10px] text-zinc-550 font-medium mt-0.5">{item.issuer}</div>
                              </div>
                              <span className="text-[10.5px] text-zinc-550 font-mono shrink-0">{item.date}</span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      {/* Certificates */}
                      <GlassCard className="p-5">
                        <SectionTitle icon={Award} label="Professional Certifications" />
                        <div className="space-y-4">
                          {profile.certificates.map((item, i) => (
                            <div key={i} className="flex justify-between items-start gap-4 p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-xs">
                              <div>
                                <div className="font-bold text-zinc-200">{item.title}</div>
                                <div className="text-[10px] text-zinc-550 font-medium mt-0.5">{item.issuer}</div>
                              </div>
                              <span className="text-[10.5px] text-zinc-555 font-mono shrink-0">{item.date}</span>
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
