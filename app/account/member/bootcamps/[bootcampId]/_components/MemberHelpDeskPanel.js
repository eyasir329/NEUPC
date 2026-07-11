/**
 * @file Member help-desk ticket panel.
 * @module MemberHelpDeskPanel
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { getMemberHelpTickets, submitHelpTicketAction } from '@/app/_lib/actions/bootcamp-actions';
import { PanelEmpty, PanelLoader } from './learning-shared';

function MemberHelpDeskPanel({ bootcampId, isArchived = false }) {
  const [tickets, setTickets] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!bootcampId) return;
    getMemberHelpTickets(bootcampId)
      .then(setTickets)
      .catch(() => setTickets([]));
  }, [bootcampId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isArchived) return;
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    const fd = new FormData();
    fd.set('bootcamp_id', bootcampId);
    fd.set('subject', subject);
    fd.set('body', body);
    const result = await submitHelpTicketAction(fd);
    if (!result.error) {
      setTickets((prev) => [
        {
          id: `h${Date.now()}`,
          subject,
          body,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        ...(prev || []),
      ]);
      setSubject('');
      setBody('');
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      {isArchived ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 text-[12.5px] leading-normal font-medium text-amber-300 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            This bootcamp is archived. The Help Desk is in read-only mode, and
            submitting new support tickets is disabled.
          </span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="relative space-y-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-5 shadow-lg shadow-black/20 backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-violet-500/[0.08] blur-[60px]" />
          <p className="relative z-10 text-[11px] font-bold tracking-widest text-violet-300 uppercase">
            Ask for help
          </p>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            required
            className="relative z-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-white placeholder-gray-600 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your issue or question…"
            rows={3}
            required
            className="relative z-10 w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[13px] text-white placeholder-gray-600 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="relative z-10 flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/15 px-4 py-2 text-[12px] font-semibold text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {sending ? 'Sending…' : 'Submit'}
          </button>
        </form>
      )}

      {tickets === null ? (
        <PanelLoader />
      ) : tickets.length === 0 ? (
        <PanelEmpty message="No help requests yet." />
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            Your tickets
          </p>
          {tickets.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors hover:border-white/20"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate text-[13px] font-medium text-white">
                  {t.subject}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${t.status === 'open' ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'}`}
                >
                  {t.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[12px] text-gray-500">
                {t.body}
              </p>
              {t.reply && (
                <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <p className="mb-1 text-[10px] font-semibold text-emerald-400 uppercase">
                    Mentor reply
                  </p>
                  <p className="text-[12px] text-gray-300">{t.reply}</p>
                </div>
              )}
              <p className="mt-1 text-[10px] text-gray-600">
                {new Date(t.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Overview Panel ───────────────────────────────────────────────────────────


export { MemberHelpDeskPanel };
