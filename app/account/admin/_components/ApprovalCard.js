/**
 * @file Approval card — single pending-approval row with approve /
 *   reject actions wired to the application server actions. Dark-glass
 *   surface and Avatar pattern matching the member panel.
 * @module ApprovalCard
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check, X, Loader2 } from 'lucide-react';
import { Avatar } from '@/app/account/_components/ui';
import {
  approveApplicationAction,
  rejectApplicationAction,
} from '@/app/_lib/actions/application-actions';

export default function ApprovalCard({ approval }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const run = (action, successMsg, extra = {}) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', approval.id);
      for (const [k, v] of Object.entries(extra)) fd.set(k, v);
      const result = await action(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(successMsg);
        setDone(true);
        router.refresh();
      }
    });
  };

  if (done) return null;

  return (
    <div className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={approval.user} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {approval.user}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {approval.type} · {approval.date}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() =>
            run(approveApplicationAction, `Approved ${approval.user}`)
          }
          disabled={isPending}
          aria-label="Approve"
          className="flex items-center gap-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-emerald-300 uppercase transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Approve
        </button>
        <button
          onClick={() =>
            run(rejectApplicationAction, `Rejected ${approval.user}`, {
              rejection_reason: 'Rejected from admin dashboard',
            })
          }
          disabled={isPending}
          aria-label="Reject"
          className="flex items-center gap-1 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-rose-300 uppercase transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          Reject
        </button>
      </div>
    </div>
  );
}
