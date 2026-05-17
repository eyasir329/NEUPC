'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, BookOpen, GraduationCap, Phone, Github, Linkedin,
  Code, Code2, FileText, ChevronRight, ChevronLeft, Send, Loader,
  CheckCircle, AlertCircle, Building, Hash, Star, Clock, XCircle,
  RefreshCw, Sparkles, Check,
} from 'lucide-react';
import { submitMembershipApplicationAction } from '@/app/_lib/user-actions';
import {
  PageShell, PageHeader, GlassCard, SectionHeader, GradientBar,
  Pill, ActionButton,
} from '../_components/_ui';

const DEPARTMENTS = [
  'Computer Science & Engineering', 'Electrical & Electronic Engineering',
  'Civil Engineering', 'Mechanical Engineering', 'Business Administration',
  'English', 'Law', 'Pharmacy', 'Architecture', 'Other',
];
const BATCHES = Array.from({ length: 12 }, (_, i) => { const s = 2019 + i; return `${s}-${String(s + 1).slice(-2)}`; });
const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

const STEPS = [
  { id: 1, label: 'Basic Info', icon: User },
  { id: 2, label: 'Academic', icon: GraduationCap },
  { id: 3, label: 'Profiles', icon: Code },
  { id: 4, label: 'About You', icon: FileText },
];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = currentStep > s.id;
        const active = currentStep === s.id;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                done ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                  : active ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-400'
                  : 'border-white/[0.08] bg-white/[0.02] text-gray-600'
              }`}>
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span className={`hidden font-mono text-[10px] uppercase tracking-wider sm:block ${
                done ? 'text-emerald-400' : active ? 'text-indigo-400' : 'text-gray-600'
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-px flex-1 transition-all ${done ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-gray-500">
      {children}{required && <span className="ml-1 text-rose-400">*</span>}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-indigo-500/40 focus:bg-white/[0.04]";
const inputErrCls = "w-full rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-rose-500/50";

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-gray-600">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-2 text-sm text-gray-500">{value || '—'}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/[0.04] py-1.5">
      <span className="text-[12px] text-gray-500">{label}</span>
      <span className="text-[12.5px] font-medium text-gray-200">{value}</span>
    </div>
  );
}

function StatusScreen({ icon: Icon, iconTone, title, children, actions }) {
  const tones = {
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  };
  return (
    <PageShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 ${tones[iconTone]}`}>
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">{title}</h2>
        {children}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      </div>
    </PageShell>
  );
}

export default function MembershipApplicationClient({ userData, latestApplication }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [errors, setErrors] = useState({});
  const [reapplying, setReapplying] = useState(false);

  const prefill = latestApplication ?? {};
  const [form, setForm] = useState({
    student_id: prefill.student_id || userData?.student_id || '',
    session: prefill.session || prefill.batch || '',
    department: prefill.department || '',
    phone: prefill.phone || '',
    semester: '',
    cgpa: '',
    github: prefill.github || '',
    linkedin: '',
    codeforces_handle: prefill.codeforces_handle || '',
    vjudge_handle: '',
    atcoder_handle: '',
    leetcode_handle: '',
    interests: Array.isArray(prefill.interests) ? prefill.interests.join(', ') : prefill.interests || '',
    reason: prefill.reason || '',
  });

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.student_id.trim()) errs.student_id = 'Student ID is required.';
      if (!form.session) errs.session = 'Session is required.';
      if (!form.department) errs.department = 'Department is required.';
    }
    if (s === 4) {
      if (!form.reason.trim()) errs.reason = 'Please tell us why you want to join.';
    }
    return errs;
  };

  const nextStep = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => Math.min(s + 1, 4));
  };
  const prevStep = () => { setErrors({}); setStep((s) => Math.max(s - 1, 1)); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateStep(4);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setServerError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
        if (latestApplication?.status === 'pending' && latestApplication?.id) fd.append('joinRequestId', latestApplication.id);
        await submitMembershipApplicationAction(fd);
        setSubmitted(true);
      } catch (err) {
        setServerError(err.message || 'Something went wrong. Please try again.');
      }
    });
  };

  // ── Status screens ──────────────────────────────────────────────────────────
  if (latestApplication?.status === 'pending' && !reapplying) {
    return (
      <StatusScreen icon={Clock} iconTone="amber" title="Application Under Review"
        actions={
          <>
            <ActionButton href="/account/guest" tone="ghost">Back to Dashboard</ActionButton>
            <ActionButton tone="indigo" icon={RefreshCw} onClick={() => { setReapplying(true); setStep(1); setErrors({}); }}>Edit Application</ActionButton>
          </>
        }
      >
        <p className="max-w-sm text-[13.5px] leading-relaxed text-gray-400">
          Your membership application submitted on{' '}
          <span className="font-medium text-gray-200">{new Date(latestApplication.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>{' '}
          is currently being reviewed. You can still edit it before a decision is made.
        </p>
      </StatusScreen>
    );
  }

  if (latestApplication?.status === 'rejected' && !reapplying) {
    return (
      <StatusScreen icon={XCircle} iconTone="rose" title="Application Rejected"
        actions={
          <>
            <ActionButton href="/account/guest" tone="ghost">Back to Dashboard</ActionButton>
            <ActionButton tone="indigo" icon={RefreshCw} onClick={() => { setReapplying(true); setStep(1); setErrors({}); }}>Re-apply</ActionButton>
          </>
        }
      >
        <p className="max-w-sm text-[13.5px] leading-relaxed text-gray-400">
          Your application submitted on{' '}
          <span className="font-medium text-gray-200">{new Date(latestApplication.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>{' '}
          was not approved.
        </p>
        {latestApplication.rejection_reason && (
          <div className="mx-auto mt-4 max-w-sm rounded-xl border border-rose-500/20 bg-rose-500/8 p-4 text-left">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-rose-400">Rejection reason</p>
            <p className="text-[13px] text-gray-300">{latestApplication.rejection_reason}</p>
          </div>
        )}
      </StatusScreen>
    );
  }

  if (submitted) {
    return (
      <StatusScreen icon={CheckCircle} iconTone="emerald" title="Application Submitted!"
        actions={<ActionButton tone="indigo" onClick={() => router.push('/account/guest')}>Back to Dashboard</ActionButton>}
      >
        <p className="max-w-sm text-[13.5px] leading-relaxed text-gray-400">
          Your membership application has been received. Our team will review it within{' '}
          <span className="font-medium text-gray-200">2–3 business days</span>.
        </p>
      </StatusScreen>
    );
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <PageShell className="max-w-[800px]">
      <PageHeader
        icon={Sparkles}
        title={reapplying ? 'Re-apply for membership' : 'Membership application'}
        subtitle="Join NEUPC and become part of our competitive programming community."
        accent="indigo"
      />

      {reapplying && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-300">
          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
          {latestApplication?.status === 'pending'
            ? 'Editing your pending application — changes will update your submission.'
            : 'Re-applying — your previous answers have been pre-filled.'}
        </div>
      )}

      {/* Step indicator */}
      <GlassCard>
        <div className="mb-4">
          <StepIndicator currentStep={step} />
        </div>
        <GradientBar value={progress} max={100} tone="indigo" />
      </GlassCard>

      {/* Form card */}
      <GlassCard className="relative overflow-hidden">
        {/* Accent top bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500/60 via-violet-500/40 to-transparent" />

        <form onSubmit={handleSubmit} className="pt-2">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                <SectionHeader icon={User} title="Personal Information" accent="indigo" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadonlyField label="Full Name" value={userData?.full_name} />
                  <ReadonlyField label="Email Address" value={userData?.email} />
                </div>
                <Field label="Student ID" required error={errors.student_id}>
                  <input className={errors.student_id ? inputErrCls : inputCls} name="student_id" placeholder="e.g. 2021-1-60-016" value={form.student_id} onChange={set('student_id')} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Session" required error={errors.session}>
                    <select className={errors.session ? inputErrCls : inputCls} value={form.session} onChange={set('session')}>
                      <option value="">Select session</option>
                      {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Department" required error={errors.department}>
                    <select className={errors.department ? inputErrCls : inputCls} value={form.department} onChange={set('department')}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone Number">
                    <input className={inputCls} type="tel" placeholder="+880 1xxx-xxxxxx" value={form.phone} onChange={set('phone')} />
                  </Field>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                <SectionHeader icon={BookOpen} title="Academic Details" accent="indigo" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Current Semester">
                    <select className={inputCls} value={form.semester} onChange={set('semester')}>
                      <option value="">Select semester</option>
                      {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="CGPA" hint="Out of 4.00">
                    <input className={inputCls} type="number" step="0.01" min="0" max="4" placeholder="e.g. 3.75" value={form.cgpa} onChange={set('cgpa')} />
                  </Field>
                </div>
                <Field label="Areas of Interest" hint="Separate multiple interests with commas">
                  <input className={inputCls} placeholder="e.g. Competitive Programming, Web Dev, AI/ML" value={form.interests} onChange={set('interests')} />
                </Field>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                <SectionHeader icon={Code} title="Online Profiles" accent="indigo" />
                <p className="text-[12px] text-gray-600">All fields are optional — fill in whichever platforms you use.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'GitHub', key: 'github', icon: Github, placeholder: 'github.com/username' },
                    { label: 'LinkedIn', key: 'linkedin', icon: Linkedin, placeholder: 'linkedin.com/in/username' },
                    { label: 'Codeforces Handle', key: 'codeforces_handle', icon: Code2, placeholder: 'your handle' },
                    { label: 'VJudge Handle', key: 'vjudge_handle', icon: Code2, placeholder: 'your handle' },
                    { label: 'AtCoder Handle', key: 'atcoder_handle', icon: Code2, placeholder: 'your handle' },
                    { label: 'LeetCode Handle', key: 'leetcode_handle', icon: Code2, placeholder: 'your handle' },
                  ].map(({ label, key, placeholder }) => (
                    <Field key={key} label={label}>
                      <input className={inputCls} placeholder={placeholder} value={form[key]} onChange={set(key)} />
                    </Field>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                <SectionHeader icon={FileText} title="Tell Us About Yourself" accent="indigo" />
                <Field label="Why do you want to join NEUPC?" required error={errors.reason}>
                  <textarea
                    rows={5}
                    maxLength={800}
                    placeholder="Tell us about your interest in competitive programming, your goals, and what you hope to contribute…"
                    value={form.reason}
                    onChange={set('reason')}
                    className={`${errors.reason ? inputErrCls : inputCls} resize-none`}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    {errors.reason ? <span className="text-[11px] text-rose-400">{errors.reason}</span> : <span />}
                    <span className={`font-mono text-[11px] ${form.reason.length > 750 ? 'text-amber-400' : 'text-gray-600'}`}>
                      {800 - form.reason.length} remaining
                    </span>
                  </div>
                </Field>

                {/* Summary */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gray-600">Application summary</p>
                  <SummaryRow label="Student ID" value={form.student_id} />
                  <SummaryRow label="Session" value={form.session} />
                  <SummaryRow label="Department" value={form.department} />
                  {form.semester && <SummaryRow label="Semester" value={form.semester} />}
                  {form.cgpa && <SummaryRow label="CGPA" value={form.cgpa} />}
                  {form.codeforces_handle && <SummaryRow label="Codeforces" value={form.codeforces_handle} />}
                  {form.github && <SummaryRow label="GitHub" value={form.github} />}
                </div>

                {serverError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{serverError}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className={`mt-8 flex items-center ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <ActionButton type="button" tone="ghost" icon={ChevronLeft} onClick={prevStep}>Back</ActionButton>
            )}
            {step < 4 ? (
              <ActionButton type="button" tone="indigo" onClick={nextStep}>
                Next <ChevronRight className="h-3.5 w-3.5" />
              </ActionButton>
            ) : (
              <ActionButton tone="indigo" icon={isPending ? Loader : Send} disabled={isPending}>
                {isPending
                  ? 'Submitting…'
                  : latestApplication?.status === 'pending' && reapplying
                  ? 'Update Application'
                  : 'Submit Application'}
              </ActionButton>
            )}
          </div>
        </form>
      </GlassCard>

      <p className="text-center font-mono text-[11.5px] text-gray-600">
        By submitting, you agree to abide by NEUPC&apos;s community guidelines and code of conduct.
      </p>
    </PageShell>
  );
}
