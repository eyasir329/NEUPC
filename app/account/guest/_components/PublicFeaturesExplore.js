'use client';

import Link from 'next/link';
import { ChevronRight, Calendar, BookOpen, Target } from 'lucide-react';

const featureIcons = {
  calendar: Calendar,
  bookOpen: BookOpen,
  target: Target,
};

export default function PublicFeaturesExplore({ features }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">🌟 Explore</h2>
        <p className="text-sm text-gray-400">Available for guest users</p>
      </div>
      <div className="space-y-3">
        {features.map((feature) => {
          const Icon = featureIcons[feature.iconKey];
          return (
            <Link
              key={feature.id}
              href={feature.link}
              className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg bg-${feature.color}-500/20 p-2`}>
                  <Icon className={`h-5 w-5 text-${feature.color}-400`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-blue-300">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-400">{feature.description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
