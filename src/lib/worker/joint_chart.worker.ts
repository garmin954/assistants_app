import { ARM_JOINT_TYPE_UNIT, ChartJointValueMap, isJointParam, JointValueKey, MODE_JOINT_TYPE } from "@/pages/Observer/options";
import { OPTION_EMPTY } from "../constant";



declare interface WorkerPush<T> {
    type: 'clear_joints' | 'set_current_joint' | 'set_joint_model' | 'message' | 'update' | 'set_rad_unit' | 'set_max_dot'
    value: T
}

// 关节位置集合
let joints: ChartJointValueMap[] = []

// 当前选择的关节
let curJoint = OPTION_EMPTY
let curJointType = 'target_joint_positions'
let dates: string[] = []
// 当前模型关节数量
let jointModel = 6
let cancelId = 0
let openUpdate = false
let isRad = false
let maxDot = 6000
let count = 0

// 消息监听
self.onmessage = (event: MessageEvent<WorkerPush<unknown>>) => {
    const { type, value } = event.data as any
    if (type != "message") {
        // console.log('type===>', `[${type}]`, `(${value})`,);
    }
    switch (type) {
        case "message":
            onHandelMessage(value as ChartJointValueMap[])
            break
        case "update":
            if (value) {
                !openUpdate && updateMessage()
            } else {
                openUpdate = false
                clearTimeout(cancelId)
            }
            break
        case "clear_joints":
            clearJoints()
            break
        case "set_current_joint":
            setCurrentJoint(value as string)
            break
        case "set_joint_model":
            setJointModel(value as number)
            break
        case "set_rad_unit":
            isRad = +value === 1
            break
        case "set_max_dot":
            maxDot = value as number
            break
        case "set_joint_object":
            setJointObject(value as JointValueKey)
            break
        case "post_chart_data":
            postChartData()
            break
        case "set_joint_type":
            curJointType = value as JointValueKey
            break
    }
};

const onHandelMessage = (data: ChartJointValueMap[]) => {
    let keys = (Object.keys(data as object) as JointValueKey[])
    // 过滤掉 'response_subtract_data'
    const filteredKeys: JointValueKey[] = keys.filter(key => key !== 'response_subtract_data');
    // 如果存在 'response_subtract_data'，则添加到最后
    if (keys.includes('response_subtract_data')) {
        filteredKeys.push('response_subtract_data');
    }
    keys = filteredKeys;

    let unit_key: JointValueKey = "target_joint_positions";
    keys.forEach((key) => {
        if (MODE_JOINT_TYPE.includes(key) || key === 'response_subtract_data') {
            if (key !== 'response_subtract_data') {
                ARM_JOINT_TYPE_UNIT['response_subtract_data'] = ARM_JOINT_TYPE_UNIT[unit_key]
            }
            // @ts-ignore
            calculateData(key, data[key]);
            unit_key = key;
        }
    });
}
// rad换算
const radsToDegrees = (rad: number) => {
    return (rad * 180.0) / Math.PI
}


// 接收到消息时触发
const calculateData = (key: JointValueKey, data: string[]) => {
    // 第一项是时间 截取掉
    const t = data.shift()
    if (key === 'xarm_joint_temperatures') {
        dates.push(String(t))
        if (dates.length >= maxDot) {
            dates.shift()
        }
    }

    let units = ARM_JOINT_TYPE_UNIT[key]

    for (const i in data.slice(0, jointModel)) {
        // 如果是选中关节就只记录选中关节的数据
        if (curJoint !== OPTION_EMPTY && +curJoint !== +i) {
            continue
        }
        if (isJointParam(key) && +i >= jointModel) {
            break
        }


        // if (!(key in joints[i])) {
        //     joints[i][key] = []
        // }
        // 限制数量
        if (joints[i][key]!.length >= maxDot) {
            joints[i][key]!.shift()
        }

        let dVal = Number(data[i])
        // 单位换算 rad to °
        if (!isRad && units?.[i] && units?.[i].includes('rad')) {
            dVal = radsToDegrees(dVal)
        }

        joints[i][key]!.push(+dVal.toFixed(3))
        count = joints[i][key]!.length
    }
}

function animate(callback: () => void) {
    clearTimeout(cancelId)
    // 模拟 requestAnimationFrame 的调用，通过 setTimeout
    return setTimeout(callback, 200); // 60 fps
}

/**
 * 用于渲染图表的通信
 */
const updateMessage = () => {
    openUpdate = true
    postChartData()
    cancelId = animate(updateMessage)
}

const postChartData = () => {
    // if (dates.length <= 0) {
    dates = Array.from({ length: count || 1 }, (_, i) => 1 + i + "");
    // }
    self.postMessage({
        type: 'joints',
        value: joints ?? [],
        label: dates
    });
}
const setCurrentJoint = (value: string) => {
    curJoint = value
}
const setJointModel = (value: number) => {
    jointModel = value > 6 ? 6 : value
}
const clearJoints = () => {
    count = 0
    joints = []
    dates = []
    setJointObject(curJointType as JointValueKey)
    postChartData()
}


const setJointObject = (key: JointValueKey) => {
    joints = [];
    for (let i = 0; i < jointModel; i++) {
        joints[i] = {} as ChartJointValueMap
        key.split('@').forEach((k) => {
            joints[i][k as JointValueKey] = []
        })
        if (key.includes('@')) {
            joints[i]['response_subtract_data'] = []
        }
    }
}

setJointObject(curJointType as JointValueKey)



