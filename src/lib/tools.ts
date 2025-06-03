import { t } from 'i18next'

export const emptyDef = (str: string, def = '') => {
    if (str) {
        return str
    }
    if (def) {
        return def
    }
    return t('system.unknown')
}





/**
 * 版本号比较
 * @param {string} version1 版本号1
 * @param {string} version2 版本号2
 * @returns {number} -1: version1 > version2, 1: version1 < version2, 0: version1 = version2
 */
export function compareVersion(version1: string, version2: string) {
    // 将版本号分割为数组
    const v1Parts = version1.toString().split(/[\._-]/);
    const v2Parts = version2.toString().split(/[\._-]/);

    // 获取最长的数组长度
    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    // 逐位比较
    for (let i = 0; i < maxLength; i++) {
        // 获取当前位的值，不存在则默认为0
        const v1 = v1Parts[i] || '0';
        const v2 = v2Parts[i] || '0';

        // 判断是否为纯数字
        const v1IsNum = /^\d+$/.test(v1);
        const v2IsNum = /^\d+$/.test(v2);

        if (v1IsNum && v2IsNum) {
            // 先比较长度
            if (v1.length !== v2.length) {
                return v1.length > v2.length ? -1 : 1;
            }
            // 长度相同，再比较数值
            const diff = parseInt(v1) - parseInt(v2);
            if (diff !== 0) {
                return diff > 0 ? -1 : 1;
            }
        } else {
            // 字符串比较
            if (v1 !== v2) {
                return v1 > v2 ? -1 : 1;
            }
        }
    }
    return 0;
}




