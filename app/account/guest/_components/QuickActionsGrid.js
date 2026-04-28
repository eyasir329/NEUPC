'use client';

import Link from 'next/link';
import { ChevronRight, User, Award, Calendar } from 'lucide-react';

const iconMap = {
  user: User,
  award: Award,
  calendar: Calendar,
};

export default function QuickActionsGrid({ actions }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {actions.map((action) => {
        const Icon = iconMap[action.iconKey] || Calendar;
        return (
          <Link
            key={action.id}
            href={action.link}
            className="group flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-[#111418] px-4 py-3.5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
              <Icon className="h-4 w-4 text-gray-400 transition-colors group-hover:text-white" />
            </div>
            <span className="flex-1 text-[13px] font-medium text-gray-200 group-hover:text-white">
              {action.label}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
          </Link>
        );
      })}
    </div>
  );
}
