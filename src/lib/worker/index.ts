// 单例模式
export class ChartWorker extends Worker {
    private static instance: ChartWorker;
    public static getInstance(): ChartWorker {
        if (!ChartWorker.instance) {
            ChartWorker.instance = new Worker(new URL('./joint_chart.worker', import.meta.url), { type: 'module' })
        }

        return ChartWorker.instance;
    }
}
