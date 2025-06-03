// 导入 react-hooks 插件
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const config = {
  // 指定路径下的文件使用插件
  files: ['**/*.{ts,tsx}'],
  plugins: {
    'react-hooks': reactHooksPlugin
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error', // 检查 Hook 的使用规则
    'react-hooks/exhaustive-deps': 'warn' // 检查 useEffect 等 Hook 的依赖项
  }
};

export default config;