import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactPlugin from 'eslint-plugin-react';
import typescriptESLintParser from '@typescript-eslint/parser';
import typescriptESLintPlugin from '@typescript-eslint/eslint-plugin';

const config = {
  // 将 parser 移到 languageOptions 中
  languageOptions: {
    parser: typescriptESLintParser,
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true
      }
    }
  },
  plugins: {
    'react-hooks': reactHooksPlugin,
    'react': reactPlugin,
    '@typescript-eslint': typescriptESLintPlugin
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error', // 检查 Hook 的使用规则
    'react-hooks/exhaustive-deps': 'warn', // 检查 useEffect 等 Hook 的依赖项
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
};

export default config;