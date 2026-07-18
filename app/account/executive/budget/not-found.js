/**
 * @file Budget not-found view
 * @module BudgetNotFound
 */

'use client';

import { Home } from 'lucide-react';
import {
  PageShell,
  GlassCard,
  ActionButton,
} from '@/app/account/_components/ui';

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex min-h-[400px] items-center justify-center">
        <GlassCard className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            Budget Entry Not Found
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            The requested budget entry could not be found or you do not have
            permission to view it.
          </p>
          <div className="mt-6 flex justify-center">
            <ActionButton
              tone="primary"
              icon={Home}
              href="/account/executive/budget"
            >
              Return to Budget List
            </ActionButton>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
