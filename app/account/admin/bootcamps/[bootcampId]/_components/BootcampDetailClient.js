/**
 * @file Bootcamp detail client component
 * @module BootcampDetailClient
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  Loader2,
  Users,
  Settings,
  LayoutList,
  Eye,
  Star,
  ChevronDown,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  GraduationCap,
  Globe,
  Lock,
  CheckCircle2,
  Info,
  UserCircle,
  X,
  Search,
  Plus,
  RefreshCw,
  ArrowRight,
  Award,
  AlertTriangle,
} from 'lucide-react';
import CurriculumBuilder from '@/app/account/admin/bootcamps/_components/CurriculumBuilder';
import EnrollmentsTab from './EnrollmentsTab';
import ThumbnailUploader from '@/app/account/admin/bootcamps/_components/ThumbnailUploader';
import {
  getStatusConfig,
  BOOTCAMP_STATUSES,
} from '@/app/account/_components/bootcamps/bootcampConfig';
import {
  updateBootcamp,
  uploadBootcampThumbnailAction,
  deleteBootcamp,
  getBootcampMentors,
  addBootcampMentor,
  removeBootcampMentor,
  searchMentorUsers,
  getBatchSummary,
  finishBatchAndStartNew,
} from '@/app/_lib/actions/bootcamp-actions';
import toast from 'react-hot-toast';
import {
  PageShell,
  PageHeader,
  TabBar,
  GlassCard,
  Pill,
} from '@/app/account/_components/ui';

const TABS = [
  { value: 'details', label: 'General Details', icon: Info },
  { value: 'curriculum', label: 'Curriculum', icon: LayoutList },
  { value: 'settings', label: 'Settings', icon: Settings },
  { value: 'enrollments', label: 'Enrollments', icon: Users },
];

const FIELD = ({ label, children, hint }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-400 uppercase">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-gray-600">{hint}</p>}
  </div>
);

const INPUT_CLASS =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 outline-none transition-all placeholder:text-gray-600';

const SELECT_CLASS =
  'w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all';

export default function BootcampDetailClient({ bootcamp }) {
  const router = useRouter();
  const pathname = usePathname();
  const isExecutive = pathname?.includes('/account/executive');
  const basePath = isExecutive
    ? '/account/executive/bootcamps'
    : '/account/admin/bootcamps';
  const [activeTab, setActiveTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [bootcampData, setBootcampData] = useState(bootcamp);
  const [hasChanges, setHasChanges] = useState(false);
  // When router.refresh() pushes new server props (e.g. after a lesson save),
  // update the display metadata only — never overwrite formData (the user's edits).
  const lessonSaveRef = useRef(null); // set by CurriculumBuilder when a lesson is active
  const prevBootcampIdRef = useRef(bootcamp.id);
  useEffect(() => {
    // Only sync when the bootcamp ID changes (i.e. navigating to a different bootcamp).
    // For refreshes on the same bootcamp, formData already has the correct values.
    if (prevBootcampIdRef.current !== bootcamp.id) {
      prevBootcampIdRef.current = bootcamp.id;
      setBootcampData(bootcamp);
      setFormData({
        title: bootcamp.title || '',
        slug: bootcamp.slug || '',
        description: bootcamp.description || '',
        thumbnail: bootcamp.thumbnail || '',
        price: bootcamp.price || 0,
        status: bootcamp.status || 'draft',
        batch_info: bootcamp.batch_info || '',
        start_date: bootcamp.start_date || '',
        end_date: bootcamp.end_date || '',
        max_students: bootcamp.max_students || '',
        is_featured: bootcamp.is_featured || false,
        enrollment_type: bootcamp.enrollment_type || 'approval',
        category: bootcamp.category || 'Web Development',
        difficulty: bootcamp.difficulty || 'Beginner',
        subtitle: bootcamp.subtitle || '',
      });
      setHasChanges(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootcamp]);

  const [formData, setFormData] = useState({
    title: bootcamp.title || '',
    slug: bootcamp.slug || '',
    description: bootcamp.description || '',
    thumbnail: bootcamp.thumbnail || '',
    price: bootcamp.price || 0,
    status: bootcamp.status || 'draft',
    batch_info: bootcamp.batch_info || '',
    start_date: bootcamp.start_date || '',
    end_date: bootcamp.end_date || '',
    max_students: bootcamp.max_students || '',
    is_featured: bootcamp.is_featured || false,
    enrollment_type: bootcamp.enrollment_type || 'approval',
    category: bootcamp.category || 'Web Development',
    difficulty: bootcamp.difficulty || 'Beginner',
    subtitle: bootcamp.subtitle || '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saves = [];

      // Always save bootcamp metadata
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          fd.append(key, String(value));
        }
      });
      saves.push(
        updateBootcamp(bootcamp.id, fd).then((updated) => {
          setBootcampData((prev) => ({ ...prev, ...updated }));
        })
      );

      // Also save the active lesson if on the curriculum tab
      if (activeTab === 'curriculum' && lessonSaveRef.current) {
        saves.push(lessonSaveRef.current());
      }

      await Promise.all(saves);
      setHasChanges(false);
      toast.success('Changes saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCoursesChange = useCallback((courses) => {
    setBootcampData((prev) => ({ ...prev, courses }));
  }, []);

  const [mentors, setMentors] = useState([]);
  const [mentorSearch, setMentorSearch] = useState('');
  const [mentorResults, setMentorResults] = useState([]);
  const [mentorSearching, setMentorSearching] = useState(false);
  const [mentorAdding, setMentorAdding] = useState(null);
  const [mentorRemoving, setMentorRemoving] = useState(null);
  const mentorSearchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        mentorSearchRef.current &&
        !mentorSearchRef.current.contains(e.target)
      ) {
        setMentorResults([]);
        setMentorSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    getBootcampMentors(bootcamp.id)
      .then(setMentors)
      .catch(() => {});
  }, [bootcamp.id]);

  useEffect(() => {
    if (!mentorSearch.trim()) {
      setMentorResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setMentorSearching(true);
      try {
        const res = await searchMentorUsers(mentorSearch);
        const assignedIds = new Set(mentors.map((m) => m.users?.id));
        setMentorResults(res.filter((u) => !assignedIds.has(u.id)));
      } catch {
        setMentorResults([]);
      } finally {
        setMentorSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [mentorSearch, mentors]);

  const handleAddMentor = async (user) => {
    setMentorAdding(user.id);
    try {
      await addBootcampMentor(bootcamp.id, user.id);
      setMentors((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          assigned_at: new Date().toISOString(),
          users: user,
        },
      ]);
      setMentorSearch('');
      setMentorResults([]);
    } catch (err) {
      toast.error(err.message || 'Failed to add mentor');
    } finally {
      setMentorAdding(null);
    }
  };

  const handleRemoveMentor = async (userId) => {
    setMentorRemoving(userId);
    try {
      await removeBootcampMentor(bootcamp.id, userId);
      setMentors((prev) => prev.filter((m) => m.users?.id !== userId));
    } catch (err) {
      toast.error(err.message || 'Failed to remove mentor');
    } finally {
      setMentorRemoving(null);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (
      !confirm(
        `Permanently delete "${bootcampData.title}"? This cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteBootcamp(bootcamp.id);
      toast.success('Bootcamp deleted');
      router.push(basePath);
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
      setDeleting(false);
    }
  };

  // ── Batch lifecycle ──────────────────────────────────────────────────────────
  const [batchModal, setBatchModal] = useState(false); // open/closed
  const [batchSummary, setBatchSummary] = useState(null); // fetched summary
  const [batchSummaryLoading, setBatchSummaryLoading] = useState(false);
  const [newBatch, setNewBatch] = useState({
    title: '',
    batch_info: '',
    start_date: '',
    end_date: '',
    max_students: '',
    price: '',
  });
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const openBatchModal = async () => {
    setBatchModal(true);
    setBatchSummaryLoading(true);
    try {
      const summary = await getBatchSummary(bootcamp.id);
      setBatchSummary(summary);
      // Pre-fill new batch with smart defaults
      const currentBatch = bootcampData.batch_info || '';
      const batchNumMatch = currentBatch.match(/\d+/);
      const nextNum = batchNumMatch ? parseInt(batchNumMatch[0]) + 1 : 2;
      const nextBatchInfo = currentBatch
        ? currentBatch.replace(/\d+/, nextNum)
        : `Batch ${nextNum}`;
      setNewBatch({
        title: bootcampData.title || '',
        batch_info: nextBatchInfo,
        start_date: '',
        end_date: '',
        max_students: bootcampData.max_students || '',
        price: bootcampData.price || '',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load batch summary');
      setBatchModal(false);
    } finally {
      setBatchSummaryLoading(false);
    }
  };

  const handleFinishBatch = async () => {
    if (!newBatch.batch_info.trim()) {
      toast.error('New batch info is required');
      return;
    }
    setBatchSubmitting(true);
    try {
      const result = await finishBatchAndStartNew(bootcamp.id, newBatch);
      toast.success('Batch finished! New batch created as draft.');
      setBatchModal(false);
      router.push(`${basePath}/${result.newBootcampId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to finish batch');
    } finally {
      setBatchSubmitting(false);
    }
  };

  const sc = getStatusConfig(formData.status);
  const statusToneMap = {
    published: 'emerald',
    draft: 'amber',
    archived: 'gray',
  };

  return (
    <>
      <PageShell>
        <PageHeader
          icon={GraduationCap}
          title={bootcampData.title || 'Untitled Track'}
          accent="violet"
          meta={
            <>
              <Pill tone={statusToneMap[formData.status] ?? 'gray'}>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${formData.status === 'published' ? 'animate-pulse' : ''} mr-1`}
                />
                {sc.label}
              </Pill>
              {bootcampData.is_featured && (
                <Pill tone="amber" icon={Star}>
                  Featured
                </Pill>
              )}
            </>
          }
          actions={
            <div className="flex items-center gap-3">
              <Link
                href={basePath}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-300"
              >
                <ChevronLeft className="h-3 w-3" />
                All Tracks
              </Link>
              {hasChanges && (
                <span className="hidden items-center gap-1.5 text-xs font-medium text-amber-400/80 sm:flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          }
        />

        <TabBar tabs={TABS} value={activeTab} onChange={setActiveTab} />

        {/* General Details */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <GlassCard className="space-y-5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-violet-400" />
                  <h2 className="text-sm font-bold text-white">
                    Basic Information
                  </h2>
                </div>
                <FIELD label="Track Title">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Full Stack Web Development Bootcamp"
                    className={INPUT_CLASS}
                  />
                </FIELD>
                <FIELD
                  label="Subtitle"
                  hint="A short tagline shown below the title."
                >
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    placeholder="e.g., Master modern web development in 12 weeks"
                    className={INPUT_CLASS}
                  />
                </FIELD>
                <FIELD
                  label="Description"
                  hint="Detailed overview shown on the bootcamp page."
                >
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Write a detailed description of this bootcamp…"
                    className={`${INPUT_CLASS} resize-y`}
                  />
                </FIELD>
              </GlassCard>
            </div>

            <div className="space-y-5">
              <GlassCard>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  <Eye className="h-3.5 w-3.5" /> Visibility
                </h3>
                <div className="space-y-2">
                  {BOOTCAMP_STATUSES.map((s) => {
                    const cfg = getStatusConfig(s);
                    const icons = {
                      published: Globe,
                      draft: Lock,
                      archived: CheckCircle2,
                    };
                    const StatusIcon = icons[s] || Globe;
                    return (
                      <label
                        key={s}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                          formData.status === s
                            ? 'border-white/15 bg-white/8'
                            : 'border-transparent hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={formData.status === s}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.badge}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {cfg.label}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {cfg.description}
                          </div>
                        </div>
                        {formData.status === s && (
                          <CheckCircle2 className="ml-auto h-4 w-4 text-violet-400" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Track Thumbnail
                </h3>
                <ThumbnailUploader
                  bootcampId={bootcamp.id}
                  currentThumbnail={formData.thumbnail}
                  uploadAction={uploadBootcampThumbnailAction}
                  onUploadSuccess={(data) => {
                    if (data?.url) {
                      setFormData((prev) => ({ ...prev, thumbnail: data.url }));
                      setHasChanges(true);
                    }
                  }}
                  onRemove={() => {
                    setFormData((prev) => ({ ...prev, thumbnail: '' }));
                    setHasChanges(true);
                  }}
                />
                <p className="mt-2.5 text-center text-[11px] text-gray-600">
                  Recommended: 1200×630px · Max 5MB
                </p>
              </GlassCard>

              <GlassCard className="space-y-4">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  <Tag className="h-3.5 w-3.5" /> Metadata
                </h3>
                <FIELD label="URL Slug" hint="/bootcamps/{slug}">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="my-bootcamp-slug"
                    className={INPUT_CLASS}
                  />
                </FIELD>
                <div className="relative">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={SELECT_CLASS}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Mobile App Dev">Mobile App Dev</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 bottom-2.5 h-4 w-4 text-gray-500" />
                </div>
                <div className="relative">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className={SELECT_CLASS}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 bottom-2.5 h-4 w-4 text-gray-500" />
                </div>
                <FIELD label="Price (BDT)">
                  <div className="relative">
                    <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-600" />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      placeholder="0 for free"
                      className={`${INPUT_CLASS} pl-9`}
                    />
                  </div>
                </FIELD>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Curriculum */}
        {activeTab === 'curriculum' && (
          <CurriculumBuilder
            bootcampId={bootcamp.id}
            initialCourses={bootcampData.courses || []}
            onCoursesChange={handleCoursesChange}
            lessonSaveRef={lessonSaveRef}
          />
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <GlassCard>
                <div className="mb-5 flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-violet-400" />
                  <h2 className="text-sm font-bold text-white">Mentors</h2>
                </div>

                {/* Assigned mentors */}
                {mentors.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {mentors.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5"
                      >
                        {m.users?.avatar_url ? (
                          <img
                            src={m.users.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20">
                            <UserCircle className="h-4 w-4 text-violet-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {m.users?.full_name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {m.users?.email}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveMentor(m.users?.id)}
                          disabled={mentorRemoving === m.users?.id}
                          className="rounded-lg p-1.5 text-gray-500 transition-all hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        >
                          {mentorRemoving === m.users?.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search to add mentor */}
                <div className="relative" ref={mentorSearchRef}>
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    value={mentorSearch}
                    onChange={(e) => setMentorSearch(e.target.value)}
                    placeholder="Search mentor by name…"
                    className={`${INPUT_CLASS} pl-9`}
                    autoComplete="off"
                  />
                  {mentorSearching && (
                    <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500" />
                  )}
                  {(mentorResults.length > 0 ||
                    (mentorSearch.trim() && !mentorSearching)) && (
                    <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a2e] shadow-xl">
                      {mentorResults.length > 0 ? (
                        mentorResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => handleAddMentor(u)}
                            disabled={mentorAdding === u.id}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5 disabled:opacity-50"
                          >
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt=""
                                className="h-7 w-7 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                                <UserCircle className="h-3.5 w-3.5 text-violet-400" />
                              </div>
                            )}
                            <span className="flex-1 truncate text-sm text-white">
                              {u.full_name}
                            </span>
                            {mentorAdding === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                            ) : (
                              <Plus className="h-3.5 w-3.5 text-violet-400" />
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2.5 text-xs text-gray-500">
                          No mentors found matching &ldquo;{mentorSearch}
                          &rdquo;.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="mb-5 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-400" />
                  <h2 className="text-sm font-bold text-white">Schedule</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FIELD label="Start Date">
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className={INPUT_CLASS}
                      style={{ colorScheme: 'dark' }}
                    />
                  </FIELD>
                  <FIELD label="End Date">
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      className={INPUT_CLASS}
                      style={{ colorScheme: 'dark' }}
                    />
                  </FIELD>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <FIELD label="Batch Info">
                    <input
                      type="text"
                      name="batch_info"
                      value={formData.batch_info}
                      onChange={handleChange}
                      placeholder="e.g., Batch 5 · Spring 2026"
                      className={INPUT_CLASS}
                    />
                  </FIELD>
                  <FIELD label="Max Students" hint="Leave blank for unlimited.">
                    <div className="relative">
                      <Users className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-600" />
                      <input
                        type="number"
                        name="max_students"
                        value={formData.max_students}
                        onChange={handleChange}
                        min="1"
                        placeholder="Unlimited"
                        className={`${INPUT_CLASS} pl-9`}
                      />
                    </div>
                  </FIELD>
                </div>
              </GlassCard>
            </div>

            <div className="space-y-5">
              <GlassCard>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                      <Star className="h-4 w-4 text-amber-400" /> Featured Track
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Show this track on the homepage.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full border border-white/5 bg-white/10 peer-checked:bg-amber-500/30 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-gray-400 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-amber-400" />
                  </label>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="mb-4 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-bold text-white">
                    Enrollment Permission
                  </h3>
                </div>
                <p className="mb-4 text-xs text-gray-500">
                  Control how members join this bootcamp.
                </p>
                <div className="space-y-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${formData.enrollment_type === 'approval' ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                  >
                    <input
                      type="radio"
                      name="enrollment_type"
                      value="approval"
                      checked={formData.enrollment_type === 'approval'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${formData.enrollment_type === 'approval' ? 'border-violet-400' : 'border-gray-600'}`}
                    >
                      {formData.enrollment_type === 'approval' && (
                        <div className="h-2 w-2 rounded-full bg-violet-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Requires Approval
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Members request access; admin approves or rejects.
                      </p>
                    </div>
                  </label>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${formData.enrollment_type === 'open' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                  >
                    <input
                      type="radio"
                      name="enrollment_type"
                      value="open"
                      checked={formData.enrollment_type === 'open'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${formData.enrollment_type === 'open' ? 'border-emerald-400' : 'border-gray-600'}`}
                    >
                      {formData.enrollment_type === 'open' && (
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Open Enrollment
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Members can enroll instantly without approval.
                      </p>
                    </div>
                  </label>
                </div>
              </GlassCard>

              {/* Batch lifecycle */}
              <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                <div className="pointer-events-none absolute -top-4 -right-4 opacity-5">
                  <RefreshCw className="h-28 w-28 text-violet-500" />
                </div>
                <h2 className="relative z-10 mb-1 flex items-center gap-2 text-sm font-bold text-violet-300">
                  <RefreshCw className="h-4 w-4" /> Batch Lifecycle
                </h2>
                <p className="relative z-10 mb-4 text-xs text-violet-300/60">
                  Archive this batch and launch a new one with the same
                  curriculum.
                </p>
                <button
                  onClick={openBatchModal}
                  className="relative z-10 flex w-full items-center justify-between rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-xs font-semibold text-violet-300 transition-all hover:border-violet-500/50 hover:bg-violet-500/20"
                >
                  Finish Current Batch &amp; Start New
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                <div className="pointer-events-none absolute -top-4 -right-4 opacity-5">
                  <Trash2 className="h-28 w-28 text-red-500" />
                </div>
                <h2 className="relative z-10 mb-1 text-sm font-bold text-red-400">
                  Danger Zone
                </h2>
                <p className="relative z-10 mb-4 text-xs text-red-300/60">
                  Irreversible and destructive actions.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="relative z-10 flex w-full items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 transition-all hover:border-red-500/50 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Delete Permanently'}
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enrollments */}
        {activeTab === 'enrollments' && (
          <EnrollmentsTab bootcampId={bootcamp.id} />
        )}
      </PageShell>

      {/* Batch Lifecycle Modal */}

      {batchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !batchSubmitting && setBatchModal(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white">
                  Finish Batch &amp; Start New
                </h2>
              </div>
              {!batchSubmitting && (
                <button
                  onClick={() => setBatchModal(false)}
                  className="rounded-lg p-1 text-gray-500 transition-colors hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="max-h-[80vh] space-y-5 overflow-y-auto px-6 py-5">
              {/* Current batch summary */}
              <div>
                <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Current Batch Summary
                </h3>
                {batchSummaryLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading
                    summary…
                  </div>
                ) : batchSummary ? (
                  <div className="space-y-3 rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 shrink-0 text-violet-400" />
                      <span className="text-sm font-semibold text-white">
                        {batchSummary.bootcamp?.title}
                      </span>
                    </div>
                    {batchSummary.bootcamp?.batch_info && (
                      <p className="text-xs text-violet-300/70">
                        {batchSummary.bootcamp.batch_info}
                      </p>
                    )}
                    {(batchSummary.bootcamp?.start_date ||
                      batchSummary.bootcamp?.end_date) && (
                      <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {batchSummary.bootcamp.start_date
                          ? new Date(
                              batchSummary.bootcamp.start_date
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                        {' → '}
                        {batchSummary.bootcamp.end_date
                          ? new Date(
                              batchSummary.bootcamp.end_date
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Ongoing'}
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {[
                        {
                          label: 'Total',
                          value: batchSummary.stats.total,
                          color: 'text-white',
                        },
                        {
                          label: 'Active',
                          value: batchSummary.stats.active,
                          color: 'text-emerald-400',
                        },
                        {
                          label: 'Completed',
                          value: batchSummary.stats.completed,
                          color: 'text-blue-400',
                        },
                        {
                          label: 'Graduated',
                          value: batchSummary.stats.graduated,
                          color: 'text-amber-400',
                          icon: Award,
                        },
                      ].map(({ label, value, color, icon: Icon }) => (
                        <div
                          key={label}
                          className="rounded-lg bg-white/5 px-1 py-2.5 text-center"
                        >
                          {Icon && (
                            <Icon
                              className={`h-3.5 w-3.5 ${color} mx-auto mb-1`}
                            />
                          )}
                          <div className={`text-base font-bold ${color}`}>
                            {value}
                          </div>
                          <div className="mt-0.5 text-[10px] text-gray-500">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Previous batches */}
              {batchSummary?.history?.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Previous Batches
                  </h3>
                  <div className="space-y-1.5">
                    {batchSummary.history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-lg border border-white/6 bg-white/3 px-3 py-2"
                      >
                        <div>
                          <span className="text-xs font-medium text-white">
                            {h.batch_info || '—'}
                          </span>
                          {h.start_date && (
                            <span className="ml-2 text-[10px] text-gray-500">
                              {new Date(h.archived_at).toLocaleDateString(
                                'en-US',
                                { month: 'short', year: 'numeric' }
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          <span>
                            <span className="font-medium text-white">
                              {h.enrollment_total}
                            </span>{' '}
                            enrolled
                          </span>
                          <span>
                            <span className="font-medium text-amber-400">
                              {h.graduated_count}
                            </span>{' '}
                            graduated
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-xs text-amber-300/80">
                  This bootcamp will be <strong>archived</strong>. A new draft
                  bootcamp will be created with the same curriculum. Enrollments
                  are <strong>not</strong> carried over.
                </p>
              </div>

              {/* New batch config */}
              <div>
                <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  New Batch Configuration
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newBatch.title}
                      onChange={(e) =>
                        setNewBatch((p) => ({ ...p, title: e.target.value }))
                      }
                      className={INPUT_CLASS}
                      placeholder="New batch title"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Batch Info <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newBatch.batch_info}
                      onChange={(e) =>
                        setNewBatch((p) => ({
                          ...p,
                          batch_info: e.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                      placeholder="e.g., Batch 6 · Fall 2026"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={newBatch.start_date}
                        onChange={(e) =>
                          setNewBatch((p) => ({
                            ...p,
                            start_date: e.target.value,
                          }))
                        }
                        className={INPUT_CLASS}
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={newBatch.end_date}
                        onChange={(e) =>
                          setNewBatch((p) => ({
                            ...p,
                            end_date: e.target.value,
                          }))
                        }
                        className={INPUT_CLASS}
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Max Students
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newBatch.max_students}
                        onChange={(e) =>
                          setNewBatch((p) => ({
                            ...p,
                            max_students: e.target.value,
                          }))
                        }
                        className={INPUT_CLASS}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Price (BDT)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newBatch.price}
                        onChange={(e) =>
                          setNewBatch((p) => ({ ...p, price: e.target.value }))
                        }
                        className={INPUT_CLASS}
                        placeholder="0 for free"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/8 px-6 py-4">
              <button
                onClick={() => setBatchModal(false)}
                disabled={batchSubmitting}
                className="rounded-xl bg-white/5 px-4 py-2 text-xs font-semibold text-gray-400 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFinishBatch}
                disabled={batchSubmitting || !newBatch.batch_info.trim()}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
              >
                {batchSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {batchSubmitting ? 'Processing…' : 'Finish Batch & Create New'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
