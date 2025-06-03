import { ARM_JOINT_TYPE_UNIT, ChartJointValueMap, isJointParam, MODE_JOINT_TYPE } from "@/pages/Home/options";
import { OPTION_EMPTY } from "../constant";

type Key = keyof typeof ARM_JOINT_TYPE_UNIT

declare interface WorkerPush<T> {
    type: 'clear_joints' | 'set_current_joint' | 'set_joint_model' | 'message' | 'update' | 'set_rad_unit' | 'set_max_dot'
    value: T
}

// 关节位置集合
let joints: ChartJointValueMap[] = []

// 当前选择的关节
let curJoint = ''
let dates: string[] = []
// 当前模型关节数量
let jointModel = 6
let cancelId = 0
let openUpdate = false
let isRad = true
let maxDot = 6000
let count = 0

// 消息监听
self.onmessage = (event: MessageEvent<WorkerPush<unknown>>) => {
    const { type, value } = event.data as any
    if (type != "message") {
        console.log('type===>', `[${type}]`, `(${value})`,);
    }
    switch (type) {
        case "message":
            (Object.keys(value as object) as Key[]).forEach((key) => {
                // @ts-ignore
                if (MODE_JOINT_TYPE.includes(key) || key === "response_subtract_data") {
                    calculateData(key, value[key])
                }
            })

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
            isRad = value as boolean
            break
        case "set_max_dot":
            maxDot = value as number
            break
        case "set_joint_object":
            setJointObject(value as Key)
            break
        case "post_chart_data":
            postChartData()
            break
    }
};

// rad换算
const radsToDegrees = (rad: number) => {
    return (rad * 180.0) / Math.PI
}

// 接收到消息时触发
const calculateData = (key: Key, data: string[]) => {
    // 第一项是时间 截取掉
    const t = data.shift()
    if (key === 'xarm_joint_temperatures') {
        dates.push(String(t))
        if (dates.length >= maxDot) {
            dates.shift()
        }
    }

    const units = ARM_JOINT_TYPE_UNIT[key]
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
    return setTimeout(callback, 300); // 60 fps
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
    dates = Array.from({ length: count }, (_, i) => 1 + i + "");
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
    joints = []
    dates = []
}


const setJointObject = (key: Key) => {
    joints = [];
    for (let i = 0; i < jointModel; i++) {
        joints[i] = {
            'response_subtract_data': [],
        } as ChartJointValueMap
        key.split('@').forEach((k) => {
            joints[i][k as Key] = []
        })
    }
}


