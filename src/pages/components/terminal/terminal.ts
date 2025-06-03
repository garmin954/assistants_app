import * as xterm from "@xterm/xterm";
import { createElement, useEffect, useRef, useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
document.head.innerHTML += "<style>.xterm-viewport{overflow-y: auto!important} .xterm {\n    cursor: text;\n    position: relative;\n    user-select: none;\n    -ms-user-select: none;\n    -webkit-user-select: none;\n}\n\n.xterm.focus,\n.xterm:focus {\n    outline: none;\n}\n\n.xterm .xterm-helpers {\n    position: absolute;\n    top: 0;\n    /**\n     * The z-index of the helpers must be higher than the canvases in order for\n     * IMEs to appear on top.\n     */\n    z-index: 5;\n}\n\n.xterm .xterm-helper-textarea {\n    padding: 0;\n    border: 0;\n    margin: 0;\n    /* Move textarea out of the screen to the far left, so that the cursor is not visible */\n    position: absolute;\n    opacity: 0;\n    left: -9999em;\n    top: 0;\n    width: 0;\n    height: 0;\n    z-index: -5;\n    /** Prevent wrapping so the IME appears against the textarea at the correct position */\n    white-space: nowrap;\n    overflow: hidden;\n    resize: none;\n}\n\n.xterm .composition-view {\n    /* TODO: Composition position got messed up somewhere */\n    background: #000;\n    color: #FFF;\n    display: none;\n    position: absolute;\n    white-space: nowrap;\n    z-index: 1;\n}\n\n.xterm .composition-view.active {\n    display: block;\n}\n\n.xterm .xterm-viewport {\n    /* On OS X this is required in order for the scroll bar to appear fully opaque */\n    background-color: #000;\n    overflow-y: scroll;\n    cursor: default;\n    position: absolute;\n    right: 0;\n    left: 0;\n    top: 0;\n    bottom: 0;\n}\n\n.xterm .xterm-screen {\n    position: relative;\n}\n\n.xterm .xterm-screen canvas {\n    position: absolute;\n    left: 0;\n    top: 0;\n}\n\n.xterm .xterm-scroll-area {\n    visibility: hidden;\n}\n\n.xterm-char-measure-element {\n    display: inline-block;\n    visibility: hidden;\n    position: absolute;\n    top: 0;\n    left: -9999em;\n    line-height: normal;\n}\n\n.xterm.enable-mouse-events {\n    /* When mouse events are enabled (eg. tmux), revert to the standard pointer cursor */\n    cursor: default;\n}\n\n.xterm.xterm-cursor-pointer,\n.xterm .xterm-cursor-pointer {\n    cursor: pointer;\n}\n\n.xterm.column-select.focus {\n    /* Column selection mode */\n    cursor: crosshair;\n}\n\n.xterm .xterm-accessibility:not(.debug),\n.xterm .xterm-message {\n    position: absolute;\n    left: 0;\n    top: 0;\n    bottom: 0;\n    right: 0;\n    z-index: 10;\n    color: transparent;\n    pointer-events: none;\n}\n\n.xterm .xterm-accessibility-tree:not(.debug) *::selection {\n  color: transparent;\n}\n\n.xterm .xterm-accessibility-tree {\n  user-select: text;\n  white-space: pre;\n}\n\n.xterm .live-region {\n    position: absolute;\n    left: -9999px;\n    width: 1px;\n    height: 1px;\n    overflow: hidden;\n}\n\n.xterm-dim {\n    /* Dim should not apply to background, so the opacity of the foreground color is applied\n     * explicitly in the generated class and reset to 1 here */\n    opacity: 1 !important;\n}\n\n.xterm-underline-1 { text-decoration: underline; }\n.xterm-underline-2 { text-decoration: double underline; }\n.xterm-underline-3 { text-decoration: wavy underline; }\n.xterm-underline-4 { text-decoration: dotted underline; }\n.xterm-underline-5 { text-decoration: dashed underline; }\n\n.xterm-overline {\n    text-decoration: overline;\n}\n\n.xterm-overline.xterm-underline-1 { text-decoration: overline underline; }\n.xterm-overline.xterm-underline-2 { text-decoration: overline double underline; }\n.xterm-overline.xterm-underline-3 { text-decoration: overline wavy underline; }\n.xterm-overline.xterm-underline-4 { text-decoration: overline dotted underline; }\n.xterm-overline.xterm-underline-5 { text-decoration: overline dashed underline; }\n\n.xterm-strikethrough {\n    text-decoration: line-through;\n}\n\n.xterm-screen .xterm-decoration-container .xterm-decoration {\n\tz-index: 6;\n\tposition: absolute;\n}\n\n.xterm-screen .xterm-decoration-container .xterm-decoration.xterm-decoration-top-layer {\n\tz-index: 7;\n}\n\n.xterm-decoration-overview-ruler {\n    z-index: 8;\n    position: absolute;\n    top: 0;\n    right: 0;\n    pointer-events: none;\n}\n\n.xterm-decoration-top {\n    z-index: 2;\n    position: relative;\n}\n</style>";


type Props = {
    options?: xterm.ITerminalOptions & xterm.ITerminalInitOnlyOptions,
    listeners?: { [prop: string]: (arg1: any, arg2: any) => any },
    className?: string
}

// 定义不同的主题
const themes = {
    light: {
        foreground: '#3f3f3f', // 前景色（文字颜色）
        background: '#ffffff', // 背景色
        selectionBackground: '#cacaca',     // 选中文本的背景色
        selectionForeground: '#3f3f3f' // 选中文本的前景色。
    },
    dark: {
        foreground: '#ffffff',
        background: '#000000',
        selectionBackground: '#cacaca',
        selectionForeground: '#3f3f3f', // 选中文本的前景色。
        cursor: '#000000'
    }
};

export function useXTerm({ options, listeners }: Props = {}) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [terminalInstance, setTerminalInstance] = useState<xterm.Terminal | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const instance = new xterm.Terminal({
            fontFamily: 'operator mono,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace',
            fontSize: 14,
            tabStopWidth: 4,
            cursorWidth: 2,
            lineHeight: 1.5,
            theme: themes[theme],
            cursorStyle: 'underline',
            cursorBlink: false,
            smoothScrollDuration: 300,
            ...options,
        });

        instance?.resize(0, 0);

        (instance as any).setTheme = (key: keyof typeof themes) => {
            instance.options.theme = themes[key];
        }
        // Listeners
        if (listeners) {
            if (listeners.onBinary)
                instance.onBinary(listeners.onBinary);
            if (listeners.onCursorMove)
                instance.onCursorMove(listeners.onCursorMove);
            if (listeners.onLineFeed)
                instance.onLineFeed(listeners.onLineFeed);
            if (listeners.onScroll)
                instance.onScroll(listeners.onScroll);
            if (listeners.onSelectionChange)
                instance.onSelectionChange(listeners.onSelectionChange);
            if (listeners.onRender)
                instance.onRender(listeners.onRender);
            if (listeners.onResize)
                instance.onResize(listeners.onResize);
            if (listeners.onTitleChange)
                instance.onTitleChange(listeners.onTitleChange);
            if (listeners.onKey)
                instance.onKey(listeners.onKey);
            if (listeners.onData)
                instance.onData(listeners.onData);
        }
        if (terminalRef.current) {
            // Mount terminal
            instance.open(terminalRef.current);
            instance.focus();
        }
        setTerminalInstance(instance);
        return () => {
            instance.dispose();
            setTerminalInstance(null);
        };
    }, [
        terminalRef,
        options,
        listeners,
        listeners?.onBinary,
        listeners?.onCursorMove,
        listeners?.onData,
        listeners?.onKey,
        listeners?.onLineFeed,
        listeners?.onScroll,
        listeners?.onSelectionChange,
        listeners?.onRender,
        listeners?.onResize,
        listeners?.onTitleChange,
    ]);


    useEffect(() => {
        if (terminalInstance) {
            (terminalInstance as any).setTheme(theme);
        }
    }, [theme]);

    return {
        ref: terminalRef,
        instance: terminalInstance,
    };
}
export function XTerm({ className = '', options, listeners, ...props }: Props) {
    const { ref } = useXTerm({
        options,
        listeners,
    });
    return createElement("div", { className: className, ref: ref, ...props });
}


