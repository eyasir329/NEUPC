'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, BookOpen, GraduationCap, Phone, Github, Linkedin,
  Code, Code2, FileText, ChevronRight, ChevronLeft, Send, Loader2,
  CheckCircle, AlertCircle, Building, Hash, Star, Clock, XCircle,
  RefreshCw, Sparkles, Check, ShieldAlert,
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
    <div className="flex items-center w-full justify-between">
      {STEPS.map((s, i) => {
        const done = currentStep > s.id;
        const active = currentStep === s.id;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex flex-1 items-center last:flex-initial">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-300 shadow-inner ${
                done ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                  : active ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.15)]'
                  : 'border-white/5 bg-zinc-950/40 text-zinc-600'
              }`}>
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span className={`hidden font-mono text-[9px] font-bold uppercase tracking-wider sm:block ${
                done ? 'text-emerald-400' : active ? 'text-indigo-400' : 'text-zinc-600'
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-3 h-[2px] w-full rounded-full transition-all duration-500 ${done ? 'bg-gradient-to-r from-emerald-500/30 to-zinc-800' : 'bg-zinc-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-zinc-500">
      {children}{required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

const inputCls = "w-full rounded-xl border border-white/10 bg-zinc-950/45 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition duration-200 focus:border-indigo-500/50 focus:bg-zinc-950/70 focus:shadow-[0_0_8px_rgba(99,102,241,0.15)] shadow-inner";
const inputErrCls = "w-full rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 outline-none transition duration-200 focus:border-rose-500/60 focus:bg-rose-500/10 focus:shadow-[0_0_8px_rgba(244,63,94,0.15)] shadow-inner";

function Field({ label, required, error, hint, children }) {
  return (
    <div className="space-y-1">
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {hint && !error && <p className="text-[10px] font-medium text-zinc-500 leading-normal">{hint}</p>}
      {error && <p className="text-[10px] font-bold text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>}
    </div>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="rounded-xl border border-white/5 bg-zinc-950/30 px-3 py-2.5 text-sm text-zinc-500 font-medium shadow-inner">{value || '—'}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/5 py-2 last:border-b-0">
      <span className="text-xs font-semibold text-zinc-500">{label}</span>
      <span className="text-xs font-bold text-zinc-200">{value}</span>
    </div>
  );
}

function StatusScreen({ icon: Icon, iconTone, title, children, actions }) {
  const tones = {
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    rose: 'border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  };
  return (
    <PageShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center max-w-md mx-auto relative overflow-hidden px-4">
        {/* Ambient background glow */}
        <div className="absolute -z-10 h-64 w-64 rounded-full bg-zinc-900/40 blur-3xl opacity-60" />

        <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border backdrop-blur-sm ${tones[iconTone]}`}>
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="mb-3 text-2xl font-extrabold text-white tracking-tight">{title}</h2>
        {children}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full">{actions}</div>
      </div>
    </PageShell>
  );
}

export default function MembershipApplicationClient({ userData, latestApplication }) {
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
            <ActionButton href="/account/guest" tone="ghost" className="flex-1 py-2.5 justify-center">Back to Dashboard</ActionButton>
            <ActionButton tone="indigo" icon={RefreshCw} className="flex-1 py-2.5 justify-center" onClick={() => { setReapplying(true); setStep(1); setErrors({}); }}>Edit Application</ActionButton>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-zinc-400 font-medium px-4">
          Your membership application submitted on{' '}
          <span className="font-bold text-zinc-200">{new Date(latestApplication.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>{' '}
          is currently being reviewed. You can edit your submitted details before a moderator confirms a decision.
        </p>
      </StatusScreen>
    );
  }

  if (latestApplication?.status === 'rejected' && !reapplying) {
    return (
      <StatusScreen icon={XCircle} iconTone="rose" title="Application Declined"
        actions={
          <>
            <ActionButton href="/account/guest" tone="ghost" className="flex-1 py-2.5 justify-center">Back to Dashboard</ActionButton>
            <ActionButton tone="indigo" icon={RefreshCw} className="flex-1 py-2.5 justify-center" onClick={() => { setReapplying(true); setStep(1); setErrors({}); }}>Re-apply Now</ActionButton>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-zinc-400 font-medium px-4">
          Your application submitted on{' '}
          <span className="font-bold text-zinc-200">{new Date(latestApplication.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>{' '}
          was not approved.
        </p>
        {latestApplication.rejection_reason && (
          <div className="w-full mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4.5 text-left shadow-lg">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-rose-400 font-black flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" /> Moderator Feedback
            </p>
            <p className="text-[12.5px] text-zinc-300 font-semibold leading-relaxed">{latestApplication.rejection_reason}</p>
          </div>
        )}
      </StatusScreen>
    );
  }

  if (submitted) {
    return (
      <StatusScreen icon={CheckCircle} iconTone="emerald" title="Application Submitted!"
        actions={<ActionButton tone="indigo" className="w-full py-2.5 justify-center" href="/account/guest">Back to Dashboard</ActionButton>}
      >
        <p className="text-[13.5px] leading-relaxed text-zinc-400 font-medium px-4">
          Your membership application has been successfully logged. Our panel moderators will verify your details within{' '}
          <span className="font-bold text-zinc-200">2–3 business days</span>. You will receive updates in your inbox!
        </p>
      </StatusScreen>
    );
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <PageShell className="max-w-[760px] text-zinc-300 selection:bg-indigo-500/30 space-y-6">
      <PageHeader
        icon={Sparkles}
        title={reapplying ? 'Modify Application' : 'Membership Application'}
        subtitle="Submit details to upgrade your guest account to a full club membership."
        accent="indigo"
      />

      {reapplying && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-300 font-semibold shadow-md"
        >
          <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
          {latestApplication?.status === 'pending'
            ? 'Updating your pending application — resubmitting will directly update your queue.'
            : 'Re-applying — we pre-filled your previous submission to save you time.'}
        </motion.div>
      )}

      {/* Step indicator */}
      <GlassCard className="border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
        <div className="mb-4">
          <StepIndicator currentStep={step} />
        </div>
        <GradientBar value={progress} max={100} tone="indigo" />
      </GlassCard>

      {/* Form card */}
      <GlassCard className="relative overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
        {/* Decorative ambient backdrop accent strip */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-transparent" />

        <form onSubmit={handleSubmit} className="pt-3 space-y-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                <SectionHeader icon={User} title="Personal Information" accent="indigo" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadonlyField label="Full Name" value={userData?.full_name} />
                  <ReadonlyField label="Email Address" value={userData?.email} />
                </div>
                
                <Field label="Student ID" required error={errors.student_id}>
                  <input className={errors.student_id ? inputErrCls : inputCls} name="student_id" placeholder="e.g. 2021-1-60-016" value={form.student_id} onChange={set('student_id')} />
                </Field>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Session / Batch" required error={errors.session}>
                    <select className={errors.session ? inputErrCls : inputCls} value={form.session} onChange={set('session')}>
                      <option value="" className="bg-zinc-900">Select session</option>
                      {BATCHES.map((b) => <option key={b} value={b} className="bg-zinc-900">{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Academic Department" required error={errors.department}>
                    <select className={errors.department ? inputErrCls : inputCls} value={form.department} onChange={set('department')}>
                      <option value="" className="bg-zinc-900">Select department</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mobile Phone Number">
                    <input className={inputCls} type="tel" placeholder="+880 1xxx-xxxxxx" value={form.phone} onChange={set('phone')} />
                  </Field>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                <SectionHeader icon={BookOpen} title="Academic Details" accent="indigo" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Current Semester">
                    <select className={inputCls} value={form.semester} onChange={set('semester')}>
                      <option value="" className="bg-zinc-900">Select semester</option>
                      {SEMESTERS.map((s) => <option key={s} value={s} className="bg-zinc-900">{s} Semester</option>)}
                    </select>
                  </Field>
                  <Field label="CGPA (Academic Status)" hint="Enter your cumulative grade point average (out of 4.00)">
                    <input className={inputCls} type="number" step="0.01" min="0" max="4" placeholder="e.g. 3.75" value={form.cgpa} onChange={set('cgpa')} />
                  </Field>
                </div>
                <Field label="Areas of Skill / Interest" hint="Separate multiple interests with commas (e.g. Algorithms, Full-stack Web, App Dev)">
                  <input className={inputCls} placeholder="e.g. Competitive Programming, Machine Learning, Web Dev" value={form.interests} onChange={set('interests')} />
                </Field>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                <SectionHeader icon={Code} title="Coding Profiles" accent="indigo" />
                <p className="text-xs text-zinc-500 font-semibold leading-normal">These accounts let our mentors track your problem solving records and configure contests.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'GitHub Profile', key: 'github', placeholder: 'e.g. github.com/username' },
                    { label: 'LinkedIn URL', key: 'linkedin', placeholder: 'e.g. linkedin.com/in/username' },
                    { label: 'Codeforces Handle', key: 'codeforces_handle', placeholder: 'your CF username' },
                    { label: 'VJudge Handle', key: 'vjudge_handle', placeholder: 'your VJudge username' },
                    { label: 'AtCoder Handle', key: 'atcoder_handle', placeholder: 'your AtCoder handle' },
                    { label: 'LeetCode Handle', key: 'leetcode_handle', placeholder: 'your LeetCode username' },
                  ].map(({ label, key, placeholder }) => (
                    <Field key={key} label={label}>
                      <input className={inputCls} placeholder={placeholder} value={form[key]} onChange={set(key)} />
                    </Field>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
                <SectionHeader icon={FileText} title="Personal Statement" accent="indigo" />
                
                <Field label="Why do you want to join NEUPC?" required error={errors.reason}>
                  <textarea
                    rows={6}
                    maxLength={800}
                    placeholder="Tell us about your coding experience, programming interests, long-term goals, and why you would like to join the club..."
                    value={form.reason}
                    onChange={set('reason')}
                    className={`${errors.reason ? inputErrCls : inputCls} resize-none`}
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    {errors.reason ? <span /> : <span />}
                    <span className={`font-mono text-[10px] font-bold ${form.reason.length > 750 ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {800 - form.reason.length} characters remaining
                    </span>
                  </div>
                </Field>

                {/* Previews / Summary */}
                <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-4.5 shadow-inner">
                  <p className="mb-3 font-mono text-[9px] font-black uppercase tracking-wider text-zinc-500">Summary of Submission</p>
                  <div className="divide-y divide-white/5">
                    <SummaryRow label="Student ID" value={form.student_id} />
                    <SummaryRow label="Session" value={form.session} />
                    <SummaryRow label="Department" value={form.department} />
                    {form.semester && <SummaryRow label="Semester" value={form.semester} />}
                    {form.cgpa && <SummaryRow label="CGPA Status" value={form.cgpa} />}
                    {form.codeforces_handle && <SummaryRow label="Codeforces Profile" value={form.codeforces_handle} />}
                    {form.github && <SummaryRow label="GitHub URL" value={form.github} />}
                  </div>
                </div>

                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-300 shadow-md"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{serverError}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className={`mt-8 flex items-center gap-3 border-t border-white/5 pt-5 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <ActionButton type="button" tone="ghost" icon={ChevronLeft} className="px-4 py-2" onClick={prevStep}>Back</ActionButton>
            )}
            {step < 4 ? (
              <ActionButton type="button" tone="indigo" className="px-4 py-2" onClick={nextStep}>
                Next Step <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </ActionButton>
            ) : (
              <ActionButton type="submit" tone="indigo" className="px-5 py-2" icon={isPending ? Loader2 : Send} disabled={isPending}>
                {isPending
                  ? 'Submitting…'
                  : latestApplication?.status === 'pending' && reapplying
                  ? 'Update Submission'
                  : 'Submit Application'}
              </ActionButton>
            )}
          </div>
        </form>
      </GlassCard>

      <p className="text-center font-mono text-[10px] font-bold text-zinc-600">
        By submitting, you agree to respect NEUPC&apos;s code of ethics, programming honor code, and guidelines.
      </p>
    </PageShell>
  );
}
