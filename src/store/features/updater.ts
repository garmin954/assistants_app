import { UPDATER_STEP } from "@/lib/constant";
import { Response } from "@/pages/Layouts/SocketState/ws";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import { check, Update } from "@tauri-apps/plugin-updater";
import { toast } from "sonner";

let update: Update

export const checkUpdater = createAsyncThunk<Response<any>, boolean>('updater/checkUpdate', async (isBeta = false) => {
    await check();
    return await invoke(`plugin:commands|set_${isBeta ? "beta" : "stable"}_updater`);
    // return await check();
})

// 下载
export const downloadApp = createAsyncThunk('updater/downloadApp', (_, { dispatch }) => {
    let contentLength = 0
    let downloaded = 0
    return update.download((event) => {
        console.log('event', event);

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
export const installApp = createAsyncThunk('updater/installApp', () => {
    return update.install()
})

export const downloadInstall = createAsyncThunk('updater/downloadInstall', (_, { dispatch }) => {
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
    description: "",
    content: "",
}

export const fetchHistoryReleases = createAsyncThunk<typeof UpdaterData, string>('updater/fetchHistoryReleases', (version) => {
    return invoke("plugin:commands|fetch_history_releases", { version })
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
        },
        openRelease: false
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
        },
        openUpdateDialog(state, action) {
            state.openRelease = action.payload
        }
    },
    extraReducers: (builder) => {
        /*******************检查更新****************** */
        builder.addCase(checkUpdater.pending, (state) => {
            state.isLoading = true;
        })
        builder.addCase(checkUpdater.rejected, (state, { error }) => {
            toast.error("检查更新失败", {
                description: error.message,
                position: "top-center",
            });
            state.isLoading = false;
        })
        builder.addCase(checkUpdater.fulfilled, (state, { payload: up }) => {
            state.isLoading = false;
            const { code, data } = up

            console.log('up', up);

            if (code === 0 && data?.is_latest) {
                // toast.info("当前已经是最新版本", {
                //     position: "top-center",
                // });
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

            console.log('update', update);

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
            console.log('downloadInstall');

            toast.error("下载安装失败", {
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
            toast.error("下载安装失败", {
                description: error.message,
                position: "top-center",
            });
            state.isLoading = false;
            state.download.showDialog = false
        })

        builder.addCase(fetchHistoryReleases.rejected, () => {
            toast.error("获取历史版本失败");
        })

        builder.addCase(fetchHistoryReleases.fulfilled, (state, { payload }) => {
            const {
                force_update = false,
                description = "",
                content = "",
            } = payload

            state.updater.current.force_update = force_update
            state.updater.current.description = description
            state.updater.current.content = content
        })
    }

})


export default slice.reducer
export type UpdaterState = ReturnType<typeof slice.getInitialState>;
export const { setUpdaterStep, openUpdateDialog } = slice.actions