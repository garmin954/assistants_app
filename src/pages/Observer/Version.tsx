import { getVersion } from "@tauri-apps/api/app";
import { useRequest } from "ahooks";

export default function Version() {
    const { data } = useRequest(async () => {
        return await getVersion();
    }, {
    });
    return (
        < div className="absolute bottom-0 right-0 text-3xl z-0 text-gray-500 py-2 px-4 rounded-tl-lg rounded-bl-sm-lg rounded-tl-sm-lg opacity-10" >
            {data ? `v${data}` : ''}
        </div >
    );
}