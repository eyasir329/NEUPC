'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function PostHogIdentify({ userId, email, name, role }) {
  useEffect(() => {
    if (userId) {
      posthog.identify(userId, { email, name, role });
    } else {
      posthog.reset();
    }
  }, [userId, email, name, role]);

  return null;
}
