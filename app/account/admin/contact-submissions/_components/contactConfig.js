/**
 * @file Contact configuration constants — submission status labels,
 *   category options, and colour mappings for admin contact components.
 * @module adminContactConfig
 */

import { Clock, Eye, MessageSquare, Archive, CheckCircle2 } from 'lucide-react';

// Status config matching DB: new | read | replied | archived
export const STATUS_CONFIG = {
  new: {
    label: 'New',
    icon: Clock,
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    dotClass: 'bg-purple-400',
    rowClass: 'border-l-2 border-l-purple-500/50',
  },
  read: {
    label: 'Read',
    icon: Eye,
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    dotClass: 'bg-blue-400',
    rowClass: '',
  },
  replied: {
    label: 'Replied',
    icon: CheckCircle2,
    badgeClass: 'bg-green-500/15 text-green-300 border-green-500/25',
    dotClass: 'bg-green-400',
    rowClass: '',
  },
  archived: {
    label: 'Archived',
    icon: Archive,
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
    dotClass: 'bg-yellow-400',
    rowClass: 'opacity-60',
  },
};

export function getStatusConfig(status) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status ?? 'Unknown',
      icon: MessageSquare,
      badgeClass: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
      dotClass: 'bg-gray-400',
      rowClass: '',
    }
  );
}

export const ALL_STATUSES = ['new', 'read', 'replied', 'archived'];
