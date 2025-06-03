export const CHARTS_OPTIONS = {
    useWorker: true,
    renderer: 'canvas',
    grid: {
        top: '5%',    // 上边距
        bottom: '10%', // 下边距
        left: '40',   // 左边距
        right: '10'   // 右边距
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
            interval: 199, // 控制 x 轴标签的显示间隔，显示第 1、200、400、600、800 和 1000 个标签
            hideOverlap: true
        },
        axisLine: {
            show: true,  // 显示轴线
            onZero: false, // 刻度线在0刻度上
        },
    },
    yAxis: {
        type: 'value',
        // offset: '20%',
        splitLine: {
            lineStyle: {
                // color: "#6e6d6d"
            }
        }
    },
    series: [
        {
            data: [0],
            type: 'line',
            symbol: 'none',
            lineStyle: {
                color: '#3662EC',
                width: 1,
            },
            animation: false
        },
    ],
    animation: false,
    tooltip: {
        trigger: 'axis', // 触发类型，'axis' 表示横轴触发
        // formatter: '({a0}:{b0}, {c0})({b0}:{b1}, {c1})',// 提示框的内容，{b} 表示类目轴的数据，{c} 表示数据值
        confine: true
    },
}

export function setChartSeries(data: number[], name = "", color = '#3662EC') {
    if (data.length <= 0) {
        data = [0]
    }
    return {
        data,
        type: 'line',
        symbol: 'none',
        name,
        lineStyle: {
            color,
            width: 1,
        },
        animation: false
    }
}