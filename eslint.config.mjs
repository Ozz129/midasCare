// Configuración ESLint única para todo el monorepo (flat config).
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'apps/api/storage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Backend NestJS (Node, CommonJS compilado).
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // La inyección de dependencias de NestJS necesita importaciones de valor
      // (emitDecoratorMetadata); forzar "import type" rompería el DI.
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': 'error',
    },
  },
  {
    files: ['apps/api/test/**/*.ts', 'apps/api/**/*.spec.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
  // Frontend React.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Scripts y archivos de configuración en JS.
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
  prettier,
);
