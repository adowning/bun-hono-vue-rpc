// Import necessary ESLint plugins and configs
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'

export default [
  // Base configuration for all files
  {
    files: ['**/*.{js,mjs,cjs,ts}']
  },

  // Language options with globals
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022
      }
    }
  },

  // Extend recommended configurations
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // Custom rules with permissive settings
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    rules: {
      // Style rules (permissive)
      quotes: ['warn', 'single'],
      semi: ['warn', 'never'],
      indent: ['warn', 2],
      'comma-dangle': ['warn', 'never'],
      'comma-spacing': ['warn', { before: false, after: true }],
      'key-spacing': ['warn', { beforeColon: false, afterColon: true }],

      // Variable and function rules (permissive)
      'no-var': 'warn',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'arrow-spacing': 'warn',

      // TypeScript specific (permissive)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      // Code quality (permissive)
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // ES6+ features (encouraged)
      'object-shorthand': 'warn',
      'prefer-template': 'warn',
      'prefer-destructuring': ['warn', { object: true, array: true }],

      // Code style (permissive)
      'space-before-function-paren': ['warn', 'never'],
      'space-infix-ops': 'warn',
      'space-unary-ops': 'warn',
      'keyword-spacing': 'warn',
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'brace-style': ['warn', '1tbs', { allowSingleLine: true }],

      // Lines and spacing (permissive)
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
      'no-trailing-spaces': 'warn',
      'eol-last': ['warn', 'always'],
      'padded-blocks': ['warn', 'never'],

      // Comments (permissive)
      'spaced-comment': ['warn', 'always'],
      'multiline-comment-style': ['warn', 'starred-block'],

      // Error prevention (some warnings instead of errors)
      eqeqeq: ['warn', 'smart'],
      'no-compare-neg-zero': 'warn',
      'no-constant-condition': 'warn',
      'no-control-regex': 'warn',
      'no-dupe-args': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'warn',
      'no-empty-character-class': 'error',
      'no-extra-boolean-cast': 'warn',
      'no-extra-semi': 'warn',
      'no-func-assign': 'error',
      'no-inner-declarations': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'warn',
      'no-negated-in-lhs': 'error',
      'no-obj-calls': 'error',
      'no-regex-spaces': 'error',
      'no-sparse-arrays': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error'
    }
  },

  // TypeScript specific configuration
  {
    files: ['**/*.{ts}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: '.'
      }
    }
  },

  // Ignore patterns
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.git/**', '*.config.js', 'drizzle/**']
  },

  // Prettier integration
  eslintPluginPrettierRecommended
]
