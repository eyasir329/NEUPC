'use client';

import Link from 'next/link';
import { ChevronRight, User, Award, Calendar } from 'lucide-react';

const quickActionIcons = {
  user: User,
  award: Award,
  calendar: Calendar,
};

export default function QuickActionsGrid({ actions }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {actions.map((action) => {
        const Icon = quickActionIcons[action.iconKey];
        return (
          <Link
            key={action.id}
            href={action.link}
            className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-${action.color}-500/20 p-2`}>
                <Icon className={`h-5 w-5 text-${action.color}-400`} />
              </div>
              <span className="font-semibold text-white">{action.label}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        );
      })}
    </div>
  );
}
