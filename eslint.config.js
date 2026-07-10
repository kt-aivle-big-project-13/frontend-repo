import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import importX from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import prettierConfig from 'eslint-config-prettier';

const fsdLayers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
    ],
    plugins: {
      boundaries,
    },
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
      // eslint-plugin-boundaries resolves modules via eslint-module-utils,
      // which reads the legacy 'import/resolver' key (not 'import-x/resolver').
      'import/resolver': {
        typescript: true,
      },
      'boundaries/elements': fsdLayers.map((type) => ({
        type,
        pattern: `src/${type}/*`,
      })),
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: fsdLayers.map((type, index) => ({
            from: { element: { types: type } },
            allow: {
              to: {
                element: { types: { anyOf: [type, ...fsdLayers.slice(index + 1)] } },
              },
            },
          })),
        },
      ],
    },
  },
  prettierConfig,
]);
