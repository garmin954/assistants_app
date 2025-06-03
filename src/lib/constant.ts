export const UNKNOWN = 'N/A';
export const OPTION_EMPTY = "00";
export enum UPDATER_STEP {
    // 检查更新
    CHECK = 'check',
    //下载
    DOWNLOAD = 'download',
    //安装
    INSTALL = 'install',
    // 正常
    NORMAL = 'normal',
}


export const DEFAULT_IP = '192.168.1.';

export const DEFAULT_PORT = "";


export const ARM_STATE_MAP = {
    1: {
        color: '#52BF53',
        txt: '运动',
    },
    2: {
        color: '#3f3f3f',
        txt: '正常',
    },
    3: {
        color: '#FF8F1F',
        txt: '暂停',
    },
    4: {
        color: '#F56C6C',
        txt: '停止',
    },
    5: {
        color: '#3f3f3f',
        txt: '停止(5)',
    },
    6: {
        color: '#3f3f3f',
        txt: '减速',
    },
    0: {
        color: '#3f3f3f',
        txt: '正常',
    },
}