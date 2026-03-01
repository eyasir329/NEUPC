/**
 * @file application configuration
 * @module applicationConfig
 */

import { Clock, CheckCircle2, XCircle } from 'lucide-react';

// Status config matching DB enum: pending | approved | rejected
export const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
    dotClass: 'bg-yellow-400',
    rowHighlight: 'border-l-2 border-l-yellow-500/50',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    badgeClass: 'bg-green-500/15 text-green-300 border-green-500/25',
    dotClass: 'bg-green-400',
    rowHighlight: '',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/25',
    dotClass: 'bg-red-400',
    rowHighlight: 'opacity-70',
  },
};

export function getStatusConfig(status) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status ?? 'Unknown',
      icon: Clock,
      badgeClass: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
      dotClass: 'bg-gray-400',
      rowHighlight: '',
    }
  );
}

export const ALL_STATUSES = ['pending', 'approved', 'rejected'];

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'Economics',
  'English',
  'Bangla',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Other',
];
