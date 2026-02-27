'use client';

import Link from 'next/link';
import { FileText, Download } from 'lucide-react';

export default function ReportsQuickAccess() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-5 w-5 text-green-400" />
        <h3 className="font-bold text-white">Reports</h3>
      </div>
      <p className="mb-4 text-sm text-gray-400">Download reports</p>
      <div className="space-y-2">
        <Link
          href="/account/advisor/reports"
          className="flex w-full items-center justify-between rounded-lg bg-green-500/10 px-3 py-2 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/20"
        >
          <span>Annual Report</span>
          <Download className="h-4 w-4" />
        </Link>
        <Link
          href="/account/advisor/reports"
          className="flex w-full items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
        >
          <span>Semester Summary</span>
          <Download className="h-4 w-4" />
        </Link>
        <Link
          href="/account/advisor/reports"
          className="flex w-full items-center justify-between rounded-lg bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
        >
          <span>Financial Report</span>
          <Download className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
