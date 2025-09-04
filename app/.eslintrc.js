module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: false,
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
    'jsx-a11y',
    'prettier',
  ],
  rules: {
    // React 최적화 규칙들
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',

    // 성능 관련 규칙들
    'react/jsx-no-bind': 'warn',
    'react/jsx-no-constructed-context-values': 'warn',

    // 코드 품질 규칙들
    'no-console': 'warn',
    'no-debugger': 'error',
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',

    // 접근성
    'jsx-a11y/accessible-emoji': 'warn',

    // prettier 연동
  'prettier/prettier': 'warn',
  // react-native plugin rules adjustments
  'react-native/sort-styles': 'off',
  'react-native/no-color-literals': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    'react-native/react-native': true,
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    '*.config.js',
  ],
};
