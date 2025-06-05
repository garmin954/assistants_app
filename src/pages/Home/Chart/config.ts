export const CHARTS_OPTIONS = {
    useWorker: true,
    renderer: 'canvas',
    grid: {
        top: '5%',    // 上边距
        bottom: '20%', // 下边距
        left: '40',   // 左边距
        right: '10'   // 右边距
    },
    legend: {
        show: true,
        bottom: 0,           // 距离底部距离
        orient: 'horizontal', // 水平排列（默认）
    },
    dataZoom: [
        {
            type: 'inside',
            start: 0,
            end: 100
        }
    ],
    xAxis: {
        type: 'category',
        data: [0],
        animation: false,
        axisLabel: {
            interval: 'auto',
        },
        axisLine: {
            show: true,  // 显示轴线
            onZero: false, // 刻度线在0刻度上
        },
    },
    yAxis: {
        type: 'value',
        min: 'dataMin',
        max: 'dataMax',
        splitLine: {
            lineStyle: {
            }
        }
    },
    animation: false,
    tooltip: {
        trigger: 'axis', // 触发类型，'axis' 表示横轴触发
        // triggerOn: "click",
        showContent: false,
        formatter: function () {
            return ``;
        }
    },
    markPoint: {},
    series: [
    ],
}

export function setChartSeries(data: number[], name = "") {

    if (data.length <= 0) {
        data = [0]
    }
    return {
        data,
        type: 'line',
        name,
        lineStyle: {
            width: 1,
        },
        animation: false,
        smooth: true,
        symbol: 'circle',  // 保留符号
        symbolSize: 5,     // 设置符号大小
        itemStyle: {
            normal: {
                opacity: 0,
            },
            borderWidth: 1
        },
        seriesLayoutBy: 'row',
    }
}