'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  PlayCircle,
  Share2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { submitMemberResourceAction } from '@/app/_lib/member-resource-submit-action';

const TYPE_OPTIONS = [
  { value: 'youtube', label: 'YouTube Video', icon: PlayCircle, placeholder: 'https://youtube.com/watch?v=...' },
  { value: 'external_link', label: 'External Link / Website', icon: Globe, placeholder: 'https://example.com/resource' },
  { value: 'facebook_post', label: 'Facebook Post', icon: Share2, placeholder: 'https://facebook.com/...' },
  { value: 'linkedin_post', label: 'LinkedIn Post', icon: Share2, placeholder: 'https://linkedin.com/...' },
];

const INPUT = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white/90 placeholder-white/20 outline-none transition-all focus:border-white/[0.18] focus:bg-white/[0.06] focus:ring-1 focus:ring-white/[0.06]';
const LABEL = 'mb-1.5 block text-[11.5px] font-medium text-white/40';

export default function MemberResourceSubmitModal({ categories = [], onClose }) {
  const [type, setType] = useState('youtube');
  const [pending, start] = useTransition();
  const [result, setResult] = useState(null); // null | { success } | { error }
  const formRef = useRef(null);
  const firstInputRef = useRef(null);

  const selectedType = TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0];

  // Focus first input on open
  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Keyboard close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (pending || result?.success) return;
    const fd = new FormData(formRef.current);
    start(async () => {
      const res = await submitMemberResourceAction(fd);
      setResult(res);
    });
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/75 px-0 sm:px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg flex flex-col rounded-none sm:rounded-2xl border-t sm:border border-white/[0.09] bg-[#0a0b0f] shadow-2xl max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Submit a resource"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] px-5 py-4">
          <div className="flex-1">
            <h2 className="text-[14px] font-semibold text-white/90">Submit a Resource</h2>
            <p className="mt-0.5 text-[11.5px] text-white/30">Suggest a resource for admins to review and publish</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-white/30 transition-all hover:border-white/[0.14] hover:text-white/60"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
          {result?.success ? (
            /* Success state */
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white/90">Resource submitted!</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/40 max-w-xs">
                  Your submission is under review. An admin will publish it once approved.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 rounded-xl border border-white/[0.09] bg-white/[0.05] px-5 py-2 text-[12.5px] font-medium text-white/70 transition-all hover:bg-white/[0.09] hover:text-white"
              >
                Done
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

              {/* Info banner */}
              <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-white/25" />
                <p className="text-[11.5px] leading-relaxed text-white/30">
                  Only URL-based resources (YouTube, links, social posts) can be submitted. Files will be uploaded by admins after review.
                </p>
              </div>

              {/* Resource type */}
              <div>
                <label className={LABEL}>Resource Type <span className="text-rose-400/70">*</span></label>
                <div className="relative">
                  <select
                    name="resource_type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={INPUT + ' appearance-none pr-8 cursor-pointer'}
                    required
                  >
                    {TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                </div>
              </div>

              {/* URL */}
              <div>
                <label className={LABEL}>URL <span className="text-rose-400/70">*</span></label>
                <input
                  ref={firstInputRef}
                  name="embed_url"
                  type="url"
                  placeholder={selectedType.placeholder}
                  className={INPUT}
                  required
                  autoComplete="off"
                />
              </div>

              {/* Title */}
              <div>
                <label className={LABEL}>Title <span className="text-rose-400/70">*</span></label>
                <input
                  name="title"
                  type="text"
                  placeholder="Give this resource a clear, descriptive title"
                  className={INPUT}
                  required
                  minLength={3}
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div>
                <label className={LABEL}>Description <span className="text-white/20">(optional)</span></label>
                <textarea
                  name="description"
                  placeholder="What is this resource about? Why is it useful?"
                  rows={3}
                  className={INPUT + ' resize-none'}
                  maxLength={500}
                />
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div>
                  <label className={LABEL}>Category <span className="text-white/20">(optional)</span></label>
                  <div className="relative">
                    <select
                      name="category_id"
                      defaultValue=""
                      className={INPUT + ' appearance-none pr-8 cursor-pointer'}
                    >
                      <option value="">No category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                  </div>
                </div>
              )}

              {/* Error */}
              {result?.error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3.5 py-3">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                  <p className="text-[12px] text-rose-300">{result.error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.06] py-2.5 text-[13px] font-medium text-white/80 transition-all hover:bg-white/[0.10] hover:text-white disabled:opacity-50 disabled:pointer-events-none"
              >
                {pending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Submit for Review</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
