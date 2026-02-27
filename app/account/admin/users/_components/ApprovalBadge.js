'use client';

import { Check, X, Clock } from 'lucide-react';

export default function ApprovalBadge({ isApproved, hasMemberProfile }) {
  // Not Applied case - user not in member_profiles
  if (!hasMemberProfile) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-gray-400 ring-1 ring-gray-500/30">
        <X className="h-3.5 w-3.5 shrink-0" />
        <span>Not Applied</span>
      </div>
    );
  }

  if (isApproved === true) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-emerald-400 ring-1 ring-emerald-500/30">
        <Check className="h-3.5 w-3.5 shrink-0" />
        <span>Approved</span>
      </div>
    );
  }

  // Pending case - user in member_profiles but not approved
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-amber-400 ring-1 ring-amber-500/30">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span>Pending</span>
    </div>
  );
}
