import { useNavigate } from 'react-router-dom';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useEffect } from 'react';


type PayloadType = {
    message: string
}
export function useTauriInit() {

    const navigate = useNavigate()

    useEffect(() => {
        let unListenOpenUrl: UnlistenFn;
        let unListenRouter: UnlistenFn;

        const init = async () => {
            // 监听open_url事件
            unListenOpenUrl = await listen<PayloadType>("open_url", (e) => {
                const url = e.payload.message; // 路径
                if (url)
                    open(url);
            });
            // 监听路由事件
            unListenRouter = await listen<PayloadType>("router", (e) => {
                const path = e.payload.message; // 路径
                if (path)
                    navigate(path);
            });
        }

        init();

        return () => {
            unListenRouter?.();
            unListenOpenUrl?.();
        };
    }, []);
}