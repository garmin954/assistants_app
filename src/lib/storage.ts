
type StorageType = 'local' | 'session';

interface StorageOptions {
    type?: StorageType;
    expire?: number; // 过期时间(秒)
}

export class WebStorage {
    private storage: Storage;

    constructor(options: StorageOptions = { type: 'local' }) {
        this.storage = options.type === 'session' ? sessionStorage : localStorage;
    }

    set(key: string, value: any, options?: StorageOptions) {
        const data = {
            value,
            expire: options?.expire ? Date.now() + options.expire * 1000 : null
        };
        this.storage.setItem(key, JSON.stringify(data));
    }

    get<T = any>(key: string, def: T): T | null {
        const item = this.storage.getItem(key);
        if (!item) return null;

        try {
            const data = JSON.parse(item);
            if (data.expire && Date.now() > data.expire) {
                this.remove(key);
                return null;
            }
            return data.value;
        } catch {
            return def;
        }
    }

    remove(key: string) {
        this.storage.removeItem(key);
    }

    clear() {
        this.storage.clear();
    }
}

// 默认导出localStorage实例
export const storage = new WebStorage();

// 导出sessionStorage实例
export const session = new WebStorage({ type: 'session' });
