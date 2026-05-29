'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PageShell, GlassCard, ActionButton } from '../../_components/ui/dashboard';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <div className="flex min-h-[400px] items-center justify-center">
        <GlassCard className="max-w-md text-center p-8">
          <div className="mx-auto mb-4 inline-flex rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="mt-2 text-sm text-gray-400">
            {error.message || 'An unexpected error occurred while loading the budget tracker.'}
          </p>
          <div className="mt-6 flex justify-center">
            <ActionButton tone="primary" icon={RefreshCw} onClick={() => reset()}>
              Try Again
            </ActionButton>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}
