import { Button } from "@/components/ui/button";
import { RootDispatch, RootState } from "@/store";
import { switchObserveState } from "@/store/features/assistants";
import { useRequest } from "ahooks";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

export default function ObserverSwitch() {
    const { t } = useTranslation();
    const dispatch = useDispatch<RootDispatch>()
    const observer = useSelector((state: RootState) => state.assistants.filter_field.observer);

    const observering = useSelector<RootState, boolean>(
        (state) => state.app.shared_state.observering
    );

    const server_state = useSelector<RootState, boolean>(
        (state) => state.assistants.server_state
    );

    const { run: onHandelObserver, loading: observerLoading } = useRequest(
        async () => {
            return dispatch(switchObserveState());
        },
        {
            manual: true,
            debounceMaxWait: 300,
            debounceLeading: true,
        }
    );

    return (
        <Button
            className="min-w-[4.5rem] w-[6rem]"
            disabled={
                !observer || !server_state
            }
            onClick={onHandelObserver}
            loading={observerLoading}
        >
            {t(`${observering ? "end" : "start"}`)}
        </Button>
    )
}