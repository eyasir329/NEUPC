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
]);

export default eslintConfig;
