import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.browser },
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,mts,cts}'], // Apply TypeScript-specific rules
    rules: {
      'no-console': 'warn', // Ensure consistency for TypeScript files
      semi: ['warn', 'never'], // Warn on missing semicolons
      quotes: ['warn', 'single'], // Warn on double quotes, enforce single quotes
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Ignore patterns
  {
    ignores: ['node_modules/', 'dist/', 'build/', '*.js'],
  },
]);
