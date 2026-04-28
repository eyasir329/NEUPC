'use client';

import Link from 'next/link';
import { Calendar, BookOpen, Target, ChevronRight } from 'lucide-react';

const iconMap = {
  calendar: Calendar,
  bookOpen: BookOpen,
  target: Target,
};

export default function PublicFeaturesExplore({ features }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#111418]">
      <div className="border-b border-white/[0.07] px-4 py-3.5">
        <h3 className="text-[13px] font-semibold text-white">Explore</h3>
        <p className="mt-0.5 text-[11.5px] text-gray-500">Available for guest users</p>
      </div>
      <div className="divide-y divide-white/[0.07]">
        {features.map((feature) => {
          const Icon = iconMap[feature.iconKey] || Calendar;
          return (
            <Link
              key={feature.id}
              href={feature.link}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                <Icon className="h-4 w-4 text-gray-400 transition-colors group-hover:text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white">{feature.title}</div>
                <div className="text-[11.5px] text-gray-500">{feature.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
