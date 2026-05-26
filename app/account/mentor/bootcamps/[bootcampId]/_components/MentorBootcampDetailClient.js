'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, Save, Loader2, Star, GraduationCap } from 'lucide-react';
import CurriculumBuilder from '@/app/account/admin/bootcamps/_components/CurriculumBuilder';
import { getStatusConfig } from '@/app/account/_components/bootcamps/bootcampConfig';
import { PageShell, PageHeader, Pill } from '@/app/account/mentor/_components/_ui';
import toast from 'react-hot-toast';

const STATUS_TONE = { published: 'emerald', draft: 'amber', archived: 'gray' };

export default function MentorBootcampDetailClient({ bootcamp }) {
  const [saving, setSaving] = useState(false);
  const [bootcampData, setBootcampData] = useState(bootcamp);
  const lessonSaveRef = useRef(null);

  const handleSave = async () => {
    if (!lessonSaveRef.current) return;
    setSaving(true);
    try {
      await lessonSaveRef.current();
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

  const sc = getStatusConfig(bootcamp.status);
  const tone = STATUS_TONE[bootcamp.status] ?? 'gray';
  const isArchived = bootcamp.status === 'archived';

  return (
    <PageShell>
      <PageHeader
        icon={GraduationCap}
        title={bootcampData.title || 'Untitled Track'}
        accent="violet"
        meta={
          <>
            <Pill tone={tone}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${bootcamp.status === 'published' ? 'animate-pulse' : ''} mr-1`} />
              {sc.label}
            </Pill>
            {bootcampData.is_featured && (
              <Pill tone="amber" icon={Star}>Featured</Pill>
            )}
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/account/mentor/bootcamps"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium"
            >
              <ChevronLeft className="h-3 w-3" />
              My Bootcamps
            </Link>
            {!isArchived && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,92,255,0.4)] transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </div>
        }
      />

      {isArchived && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-xs uppercase tracking-wider text-amber-400">Archived Cohort (Read-Only)</p>
            <p className="text-xs text-amber-200/80 mt-0.5">This bootcamp has been archived. You can view the curriculum and lesson contents, but all syllabus edits, module additions, and lesson updates are disabled.</p>
          </div>
        </div>
      )}

      <CurriculumBuilder
        bootcampId={bootcamp.id}
        initialCourses={bootcampData.courses || []}
        onCoursesChange={handleCoursesChange}
        lessonSaveRef={lessonSaveRef}
        readOnly={isArchived}
      />
    </PageShell>
  );
}
