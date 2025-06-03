export default class AsyncLock {
    private locks: Map<string, Promise<void>> = new Map();

    /**
     * 获取锁
     * @param key 锁的键（例如 target）
     * @param fn 需要执行的异步函数
     */
    async acquire<T>(key: string, fn: () => Promise<T>): Promise<T> {
        // 获取当前锁
        let release: () => void;
        const newLock = new Promise<void>((resolve) => {
            release = resolve;
        });

        // 将新锁加入队列
        const currentLock = this.locks.get(key);
        this.locks.set(key, (currentLock || Promise.resolve()).then(() => newLock));

        try {
            // 等待锁
            await currentLock;
            // 执行函数
            return await fn();
        } finally {
            // 释放锁
            release!();
            // 清理锁
            if (this.locks.get(key) === newLock) {
                this.locks.delete(key);
            }
        }
    }
}

