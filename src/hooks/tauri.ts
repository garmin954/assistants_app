import { useNavigate } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';


type PayloadType = {
    message: string
}
export async function useTauriInit() {

    const navigate = useNavigate()

    // 监听open_url事件
    const unListenOpenUrl = await listen<PayloadType>("open_url", (e) => {
        const url = e.payload.message; // 路径
        if (url)
            open(url);
    });
    // 监听路由事件
    const unListenRouter = await listen<PayloadType>("router", (e) => {
        const path = e.payload.message; // 路径
        if (path)
            navigate(path);
    });

    // 3、获取文件路径
    // if (!await existsFile(setting.appDataDownloadDirUrl))
    //     setting.appDataDownloadDirUrl = `${await appDataDir()}\\downloads`;


    return () => {
        unListenRouter?.();
        unListenOpenUrl?.();
    };
}