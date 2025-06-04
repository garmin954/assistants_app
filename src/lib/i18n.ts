import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend'; // 加载语言文件
import LanguageDetector from 'i18next-browser-languagedetector'; // 检测浏览器语言


i18n
    .use(Backend) // 使用 HTTP 加载语言文件（如 `public/locales/{{lng}}/{{ns}}.json`）
    .use(LanguageDetector) // 自动检测浏览器语言
    .use(initReactI18next) // 绑定 React 实例
    .init({
        fallbackLng: 'en-US',  // Simplify fallback configuration
        supportedLngs: ['en-US', 'zh-CN'],  // Only support full language codes
        load: 'currentOnly',  // Prevent loading partial language codes
        debug: import.meta.env.NODE_ENV === 'development', // 开发环境打印日志
        interpolation: {
            escapeValue: false, // 不转义 HTML（需要时开启）
        },
        // 语言文件命名空间（可分模块管理，如 `common`、`auth` 等）
        ns: ['common'],
        defaultNS: 'common',
        backend: {
            // 指定语言文件的加载路径（注意路径中的 __dirname 或 publicPath）
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
    });



export default i18n;