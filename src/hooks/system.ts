import { getCurrentWebviewWindow, } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";

/**
 * 卸载设置
 */
export function useSettingUnmounted() {
    // window.removeEventListener("resize", () => { });
    // window.removeEventListener("contextmenu", () => { });
    // window.removeEventListener("keydown", () => { });
    // const setting = useSettingStore();
    // setting.appUploader.isCheckUpdatateLoad = false;
    // setting.appUploader.isUpdating = false;
    // setting.appUploader.isUpload = false;
}


// const dev = import.meta.env.MODE === "development";

/**
 * 初始化快捷键
 */
export function useHotkeyInit() {
    useEffect(() => {
        // 开发模式屏蔽
        if (import.meta.env.MODE === "development") {
            return;
        }

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            const ctrl_shift = e.ctrlKey && e.shiftKey

            // 关闭调式工具
            const isDevTools = (e.key === "F12") || (e.key === "J" && ctrl_shift) || (e.key === "C" && ctrl_shift) //|| (e.key === "I" && ctrl_shift);
            // 关闭快捷键
            const isReload = (e.key === "F5") || (e.key === "r" && e.ctrlKey) || (e.key === "R" && ctrl_shift);
            // 关闭打印
            const isPrint = (e.key === "p" && e.ctrlKey) || (e.key === "P" && ctrl_shift);
            // 关闭搜索
            const isSearch = (e.key === "f" && e.ctrlKey) || (e.key === "F" && ctrl_shift) || (e.key === "g" && e.ctrlKey) || (e.key === "G" && ctrl_shift);;

            // 其它
            const isOther = (e.key === "F7") || (e.key === "j" && e.ctrlKey) || (e.key === "u" && e.ctrlKey)

            if (isPrint || isDevTools || isSearch || isReload || isOther)
                e.preventDefault();
            // esc 最小化窗口
            if (e.key === "Escape") {
                e.preventDefault();
                const appWindow = getCurrentWebviewWindow();
                appWindow.minimize();
            }
        }

        // 阻止默认行为，防止右键菜单弹出
        window.addEventListener("contextmenu", handleContextMenu);
        // 快捷键阻止
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("contextmenu", handleContextMenu);
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, []);
}

