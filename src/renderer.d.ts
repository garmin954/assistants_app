import { WebSocketHook, JsonValue, MessageEvent } from 'react-use-websocket';

declare global {
    interface Window {
        ws: WebSocketHook<JsonValue, MessageEvent<never>>
    }
    interface Response<T> {
        cmd?: string,
        data: T,
        code: number,
        type: 'response' | 'report',
    }
}

export { };

