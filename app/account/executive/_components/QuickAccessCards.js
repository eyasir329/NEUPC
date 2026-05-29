'use client';

import { ImageIcon, Award, BarChart3, Plus, Settings, Eye } from 'lucide-react';
import { GlassCard, SectionHeader, ActionButton } from './_ui';

const CARDS = [
  {
    icon: ImageIcon,
    title: 'Gallery',
    subtitle: 'Manage club photos',
    accent: 'cyan',
    href: '/account/executive/gallery/manage',
    btnLabel: 'Upload',
    btnIcon: Plus,
    tone: 'primary',
  },
  {
    icon: Award,
    title: 'Recognitions',
    subtitle: 'Awards & certificates',
    accent: 'amber',
    href: '/account/executive/recognitions',
    btnLabel: 'Manage',
    btnIcon: Settings,
    tone: 'amber',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    subtitle: 'Analytics & insights',
    accent: 'violet',
    href: '/account/executive/reports',
    btnLabel: 'View',
    btnIcon: Eye,
    tone: 'ghost',
  },
];

export default function QuickAccessCards() {
  return (
    <div className="flex flex-col gap-3">
      {CARDS.map((card) => (
        <GlassCard key={card.title} padding="p-4">
          <SectionHeader
            icon={card.icon}
            title={card.title}
            subtitle={card.subtitle}
            accent={card.accent}
          />
          <ActionButton tone={card.tone} href={card.href} icon={card.btnIcon} className="w-full justify-center">
            {card.btnLabel}
          </ActionButton>
        </GlassCard>
      ))}
    </div>
  );
}
