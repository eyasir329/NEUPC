import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Deprecated middleware file (replaced by middleware.js)
    'proxy.js',
  ]),
  // Production-quality rules
  {
    rules: {
      // Warn on console.log (allow warn/error for legitimate logging)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Prevent unused variables (ignore prefixed with _)
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // The following rules are useful, but currently too noisy for this repo.
      // Keep them as warnings so lint doesn't fail CI while we refactor.
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-no-comment-textnodes': 'warn',
    },
  },

  // ── Architecture boundary: DAL is the only door to Supabase ──────────────
  // System-design invariant (docs/architecture/system-design/09-adr/0003).
  // ~133 files currently violate this (audited Phase 0), so the rule is a
  // `warn`-level RATCHET: it stops NEW direct Supabase access without failing
  // the build on the existing debt. As each area is migrated into the DAL
  // (app/_lib/services/data/*), tighten toward 'error' per-directory.
  //
  // Exempt: the DAL itself, and the client definition module.
  {
    files: ['**/*.{js,jsx,mjs}'],
    ignores: [
      'app/_lib/services/data/**',
      'app/_lib/integrations/supabase.js',
      // The multi-database router tier IS a door to Supabase (the choke point
      // that owns provider selection, outbox, and failover) — a peer of the DAL,
      // legitimately allowed to import the client directly. Docs:
      // docs/architecture/proposals/multi-database/03-router-and-caching.md
      'app/_lib/db/**',
    ],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: [
                '@/app/_lib/integrations/supabase',
                '**/integrations/supabase',
                '**/_lib/integrations/supabase',
              ],
              message:
                'Do not access Supabase directly. Route DB access through the data-access layer (app/_lib/services/data/*). See docs/architecture/system-design/09-adr/0003-strict-layering.md',
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
