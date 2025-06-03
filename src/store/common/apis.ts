
export type ApisOpts = {
    label: string,
    value: string,
    loading: boolean
}


export const setOptState = (state: (ApisOpts | ApisOpts[])[], value: string, loading: boolean) => {
    return state.map((opt) => {
        // 处理数组类型的选项
        if (Array.isArray(opt)) {
            return opt.map((subOpt) => {
                if (subOpt.value === value || subOpt.value.startsWith(value + "@")) {
                    return {
                        ...subOpt,
                        loading
                    }
                }
                return subOpt
            })
        }
        
        // 处理单个选项对象
        if (opt.value === value || opt.value.startsWith(value + "@")) {
            return {
                ...opt,
                loading
            }
        }
        return opt
    })
}