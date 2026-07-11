import posthog from 'posthog-js';
import * as Sentry from '@sentry/nextjs';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
  api_host: '/ingest',
  ui_host: 'https://us.posthog.com',
  defaults: '2026-05-30',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === 'development',
});

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    debug: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
