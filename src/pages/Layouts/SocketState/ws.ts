import { v4 as uuidv4 } from 'uuid';
import Emittery from 'emittery';
import { WebSocketHook } from 'react-use-websocket/dist/lib/types';




export type Response<R> = {
    code: number,
    data: R,
    id: string,
    msg?: string,
    type: string
    cmd?: string,
}

type LogResponse = {
    color: string,
    msg: string
}


export enum EMIT_EVENTS {
    TARGET_ACTUAL_STATUS_REPORT = "TARGET_ACTUAL_STATUS_REPORT",
}
class WebSocketSingleton {
    private static instance: WebSocketSingleton | null = null;
    private ws: WebSocketHook | null = null;
    private id = uuidv4();
    private responseMap: Map<string, (data: any) => void> = new Map();
    private emitter = new Emittery(); //订阅
    private emitEvents = new Set<string>();

    // @ts-ignore
    private cbLogger: (r: LogResponse) => void = () => { };


    private constructor() { }

    public static getInstance(): WebSocketSingleton {
        if (!WebSocketSingleton.instance) {
            WebSocketSingleton.instance = new WebSocketSingleton();
        }
        return WebSocketSingleton.instance;
    }

    public async init(ws: WebSocketHook) {
        if (!this.ws) {
            this.ws = ws
        }
        return this.ws;
    }

    /**
     * onMessage
     */
    public onMessage(response: Response<unknown>) {

        if (response) {
            const { code, type } = response

            if (type === "response" && code === 1001) {
                response.code = 0
            }


            // 订阅事件的通信
            const EVENT_TYPE = type.toLocaleUpperCase()
            if (this.emitEvents.has(EVENT_TYPE) && code !== 1001) {
                this.emitter.emit(EVENT_TYPE, response);
            }

            // 正常响应数据
            if (type === "response" && response.code !== 1001) {
                this.responseMap.get(response.id)?.(response);
                this.responseMap.delete(response.id);
            }
        }
    }

    // 发送
    public async send<R>(cmd: string, data = {}, _timeout = 30000) {
        if (this.ws) {
            this.id = uuidv4();
            const command = ({
                id: this.id,
                cmd,
                data: data || {}
            });

            return new Promise<Response<R>>((resolve, _reject) => {
                // 设置超时处理
                // const timeoutId = setTimeout(() => {
                //     this.responseMap.delete(this.id);
                //     reject(new Error(`请求超时: ${cmd}`));
                // }, timeout);

                // 保存回调和超时ID
                this.responseMap.set(this.id, (response) => {
                    // clearTimeout(timeoutId);
                    resolve(response);
                });

                this.ws!.sendJsonMessage(command);
            });

        } else {
            throw new Error('WebSocket not initialized.as');
        }
    }


    public onListenerLog(callback: (r: LogResponse) => void) {
        this.cbLogger = callback;
    }


    public off<T>(target: string, lst: (d: T) => void) {
        if (target in EMIT_EVENTS) {
            this.emitEvents.delete(target);
            this.emitter.off(target, lst)
        }
    }


    public clear(target: string) {
        if (target in EMIT_EVENTS) {
            this.emitEvents.delete(target);
            this.emitter.clearListeners(target)
        }
    }


    /**
     * 监听回调
     * @param target 
     * @param lst 
     * @returns 
     */
    public listener<T>(target: string, lst: (d: T) => void) {
        if (target in EMIT_EVENTS) {
            this.emitEvents.add(target);
            this.emitter.on(target, lst)
            return
        }
        console.warn(`${target} is not a valid event name.`);
        throw new Error(`${target} is not a valid event name.`);
    }

    public pull<T>(target: string, data: (d: T) => void) {
        if (target in EMIT_EVENTS) {
            this.emitEvents.add(target);
            this.emitter.emit(target, data)
            return
        }
        console.warn(`${target} is not a valid event name.`);
        throw new Error(`${target} is not a valid event name.`);
    }
}

export const ws = WebSocketSingleton.getInstance();