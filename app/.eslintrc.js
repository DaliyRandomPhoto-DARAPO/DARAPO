module.exports = {
  root: true,
  extends: [
    'expo',
    '@react-native-async-storage/eslint-plugin',
    'prettier'
  ],
  plugins: ['@react-native-async-storage'],
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
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    
    // React Native 최적화
    '@react-native-async-storage/no-global-storage': 'error',
    
    // 접근성
    'jsx-a11y/accessible-emoji': 'warn',
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
