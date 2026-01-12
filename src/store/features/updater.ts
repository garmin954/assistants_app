import { UPDATER_STEP } from "@/lib/constant";
import i18n from "@/lib/i18n";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import { Update } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";
let update: Update

// helper: always use "updater" namespace
const tUpdater = (key: string, options?: any) =>
    i18n.t(key, { ns: "updater", ...options }) as string;

console.log('i18n test', i18n.language, i18n.t("updater.checking_update"));
const ensureLinuxAppImage = async () => {
    const isAppImage = await invoke<boolean>("is_appimage");
    if (!isAppImage) {
        toast.error(tUpdater("linux_appimage_required"), {
            position: "top-center",
        });
    }
    return isAppImage;
};
export const checkUpdater = createAsyncThunk<any, boolean>('updater/checkUpdate', async (isBeta = false) => {
    return await invoke(`set_${isBeta ? "beta" : "stable"}_updater`);
    // return await check();
})

// 下载
export const downloadApp = createAsyncThunk('updater/downloadApp', (_data, { dispatch }) => {
    let contentLength = 0
    let downloaded = 0
    return update.download((event) => {
        switch (event.event) {
            case 'Started':
                contentLength = event.data.contentLength || 0;
                dispatch({
                    type: 'updater/downloadProgress', payload: {
                        startTime: Date.now(),
                    }
                })
                break;
            case 'Progress':
                downloaded += event.data.chunkLength;
                dispatch({
                    type: 'updater/downloadProgress', payload: {
                        progress: downloaded / contentLength * 100,
                        totalSize: contentLength,
                        downloaded: downloaded,
                        curTime: Date.now(),
                    }
                })
                break;
            case 'Finished':
                console.log('download finished');
                break;
        }
    });
})

// 安装
export const installApp = createAsyncThunk('updater/installApp', async (_data, { dispatch }) => {
    if (!(await ensureLinuxAppImage())) {
        return;
    }
    try {
        // 关闭服务
        let res = await update.install();
        console.log('installApp', res);
        dispatch(closeDownloadDialog());
        toast.success(tUpdater("install_complete_tip"), {
            position: "top-center",
        });
        // 安装完成后重启应用以加载新版本（兼容 single-instance）
        // await invoke("restart_app");
    } catch (error: any) {
        toast.error(tUpdater("download_install_failed"), {
            description: error?.message,
            position: "top-center",
        });
        throw error;
    }
})

export const downloadInstall = createAsyncThunk('updater/downloadInstall', async (_data, { dispatch }) => {
    if (!(await ensureLinuxAppImage())) {
        return;
    }
    let contentLength = 0
    let downloaded = 0
    return update.downloadAndInstall((event) => {
        switch (event.event) {
            case 'Started':
                contentLength = event.data.contentLength || 0;
                dispatch({
                    type: 'updater/downloadProgress', payload: {
                        startTime: Date.now(),
                    }
                })
                break;
            case 'Progress':
                downloaded += event.data.chunkLength;
                dispatch({
                    type: 'updater/downloadProgress', payload: {
                        progress: downloaded / contentLength * 100,
                        totalSize: contentLength,
                        downloaded: downloaded,
                        curTime: Date.now(),
                    }
                })
                break;
            case 'Finished':
                console.log('download finished');
                break;
        }
    });
})



const UpdaterData = {
    force_update: false,
    description: {
        cn: "",
        en: "",
    },
    content: {
        cn: "",
        en: "",
    },
}

export const fetchHistoryReleases = createAsyncThunk<typeof UpdaterData, string>('updater/fetchHistoryReleases', (version, { }) => {
    return invoke("fetch_history_releases", { version })
})


const slice = createSlice({
    name: 'updater',
    initialState: {
        isLoading: false,
        step: UPDATER_STEP.CHECK,
        download: {
            showDialog: false,
            progress: 0,
            totalSize: 0,
            downloaded: 0,
            startTime: Date.now(),
            curTime: Date.now(),
        },
        updater: {
            version: "",
            body: UpdaterData,
            currentVersion: "",
            date: "",
            current: UpdaterData,
        }
    },

    reducers: {
        closeDownloadDialog(state) {
            state.download.showDialog = false
        },
        downloadProgress(state, action) {
            state.download = { ...state.download, ...action.payload }
        },
        setUpdaterStep(state, action) {
            state.step = action.payload
        }
    },
    extraReducers: (builder) => {
        /*******************检查更新****************** */
        builder.addCase(checkUpdater.pending, (state) => {
            state.isLoading = true;
        })
        builder.addCase(checkUpdater.rejected, (state) => {
            state.isLoading = false;
        })
        builder.addCase(checkUpdater.fulfilled, (state, { payload: up }) => {
            state.isLoading = false;
            const { code, data, message } = up
            console.log('data===>', up)

            if (code === -1) {
                toast.error(tUpdater("check_update_failed"), {
                    description: message,
                    position: "top-center",
                });
                return;
            }

            if (code === 0 && data?.is_latest) {
                state.step = UPDATER_STEP.NORMAL
                return;
            }


            const { version, currentVersion, date = "", body = "" } = data
            state.updater = ({
                version,
                body: JSON.parse(body) as typeof UpdaterData || UpdaterData,
                currentVersion,
                date,
                current: state.updater.current
            });
            state.step = UPDATER_STEP.DOWNLOAD

            update = new Update({
                ...data
            });

            // update = up
        })

        /*******************下载安装****************** */
        builder.addCase(downloadInstall.pending, (state) => {
            state.isLoading = true;
            state.download.showDialog = true
        })

        builder.addCase(downloadInstall.fulfilled, (state) => {
            // state.isLoading = true;
            state.download.showDialog = false
        })

        builder.addCase(downloadInstall.rejected, (state, { error }) => {
            toast.error(tUpdater("download_install_failed"), {
                description: error.message,
                position: "top-center",
            });
            state.isLoading = false;
            state.download.showDialog = false
        })


        /*******************下载****************** */
        builder.addCase(downloadApp.pending, (state) => {
            state.isLoading = true;
            state.download.showDialog = true
        })

        builder.addCase(downloadApp.fulfilled, (state) => {
            state.step = UPDATER_STEP.INSTALL
            // state.isLoading = true;
            // state.download.showDialog = false
        })

        builder.addCase(downloadApp.rejected, (state, { error }) => {
            toast.error(tUpdater("download_install_failed"), {
                description: error.message,
                position: "top-center",
            });
            state.isLoading = false;
            state.download.showDialog = false
        })

        builder.addCase(fetchHistoryReleases.rejected, () => {
            toast.error(tUpdater("fetch_history_releases_failed"));
        })

        builder.addCase(fetchHistoryReleases.fulfilled, (state, { payload }) => {
            const {
                force_update = false,
                description = {
                    cn: "",
                    en: "",
                },
                content = {
                    cn: "",
                    en: "",
                },
            } = payload

            state.updater.current.force_update = force_update
            state.updater.current.description = description
            state.updater.current.content = content
        })
    }

})


export default slice.reducer
export type UpdaterState = ReturnType<typeof slice.getInitialState>;
export const { setUpdaterStep, closeDownloadDialog } = slice.actions
