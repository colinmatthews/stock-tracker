
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

/**
 * Base hook for reactive access to window.openai global state.
 * Uses useSyncExternalStore for proper React 18+ concurrent mode support.
 */
export function useOpenAiGlobal(key) {
  return useSyncExternalStore(
    (onChange) => {
      const handler = (event) => {
        if (event.detail?.globals?.[key] !== undefined) {
          onChange();
        }
      };
      window.addEventListener("openai:set_globals", handler);
      return () => window.removeEventListener("openai:set_globals", handler);
    },
    () => window.openai?.[key] ?? null,
    () => window.openai?.[key] ?? null
  );
}

/**
 * Get current display mode (inline/fullscreen/pip).
 * Automatically updates when display mode changes.
 */
export function useDisplayMode() {
  return useOpenAiGlobal("displayMode");
}

/**
 * Get toolOutput data reactively with optional fallback.
 * This is the recommended way to access data passed to the component.
 *
 * @param defaultState - Optional default value or function returning default
 * @returns The toolOutput data or defaultState if not available
 */
export function useWidgetProps(defaultState) {
  const props = useOpenAiGlobal("toolOutput");
  if (props != null) return props;
  if (defaultState == null) return null;
  return typeof defaultState === "function" ? defaultState() : defaultState;
}

/**
 * Bidirectional state sync with window.openai.setWidgetState.
 * State persists across re-renders and is synced to the host.
 *
 * @param defaultState - Initial state value or function returning initial state
 * @returns [state, setState] tuple similar to useState
 */
export function useWidgetState(defaultState) {
  const widgetStateFromWindow = useOpenAiGlobal("widgetState");
  const initialState = widgetStateFromWindow ??
    (typeof defaultState === "function" ? defaultState() : defaultState);
  const [state, _setState] = useState(initialState);

  useEffect(() => {
    if (widgetStateFromWindow != null) {
      _setState(widgetStateFromWindow);
    }
  }, [widgetStateFromWindow]);

  const setState = useCallback((valueOrFn) => {
    _setState((prev) => {
      const newState = typeof valueOrFn === "function" ? valueOrFn(prev) : valueOrFn;
      if (newState != null && window.openai?.setWidgetState) {
        window.openai.setWidgetState(newState);
      }
      return newState;
    });
  }, []);

  return [state, setState];
}

/**
 * Get max height constraint for the widget.
 * Useful for implementing scrollable content areas.
 */
export function useMaxHeight() {
  return useOpenAiGlobal("maxHeight");
}

/**
 * Get the current theme (light/dark).
 */
export function useTheme() {
  return useOpenAiGlobal("theme");
}

/**
 * Get the current locale/language preference.
 */
export function useLocale() {
  return useOpenAiGlobal("locale");
}

/**
 * Get toolInput (parameters passed when the tool was called).
 */
export function useToolInput() {
  return useOpenAiGlobal("toolInput");
}

/**
 * Hook for calling other tools from within a widget.
 * Returns a function that can invoke MCP tools.
 *
 * @returns callTool function: (toolName: string, params: object) => Promise<void>
 */
export function useCallTool() {
  return useCallback(async (toolName, params = {}) => {
    if (!window.openai?.callTool) {
      console.warn("window.openai.callTool not available");
      return;
    }
    return window.openai.callTool(toolName, params);
  }, []);
}

/**
 * Hook for sending follow-up messages to the chat.
 * Returns a function that inserts a message into the conversation.
 *
 * @returns sendMessage function: (text: string) => Promise<void>
 */
export function useSendMessage() {
  return useCallback(async (text) => {
    if (!window.openai?.sendFollowUpMessage) {
      console.warn("window.openai.sendFollowUpMessage not available");
      return;
    }
    return window.openai.sendFollowUpMessage({ prompt: text });
  }, []);
}

/**
 * Hook for opening external URLs.
 * Returns a function that opens a URL in a new tab.
 *
 * @returns openExternal function: (url: string) => void
 */
export function useOpenExternal() {
  return useCallback((url) => {
    if (!window.openai?.openExternal) {
      // Fallback to window.open
      window.open(url, "_blank");
      return;
    }
    window.openai.openExternal({ href: url });
  }, []);
}

/**
 * Hook for requesting display mode changes.
 * Returns a function to change between inline/fullscreen/pip modes.
 *
 * @returns requestDisplayMode function: (mode: 'inline' | 'fullscreen' | 'pip') => void
 */
export function useRequestDisplayMode() {
  return useCallback((mode) => {
    if (!window.openai?.requestDisplayMode) {
      console.warn("window.openai.requestDisplayMode not available");
      return;
    }
    window.openai.requestDisplayMode({ mode });
  }, []);
}

/**
 * Hook for closing/dismissing the widget.
 * Returns a function that closes the current widget.
 *
 * @returns requestClose function: () => void
 */
export function useRequestClose() {
  return useCallback(() => {
    if (!window.openai?.requestClose) {
      console.warn("window.openai.requestClose not available");
      return;
    }
    window.openai.requestClose();
  }, []);
}

/**
 * Get the current view context (mode and params).
 * Returns { mode: 'modal', params: {...} } when in modal, otherwise { mode: 'inline', params: {} }
 */
export function useView() {
  return useOpenAiGlobal("view") || { mode: "inline", params: {} };
}

/**
 * Hook for requesting a modal overlay.
 * The same widget re-renders with view.mode = "modal" when granted.
 *
 * @returns requestModal function: (opts: { title: string, params: object, anchorElement?: HTMLElement }) => Promise<void>
 */
export function useRequestModal() {
  return useCallback(async (opts) => {
    if (!window.openai?.requestModal) {
      console.warn("window.openai.requestModal not available");
      return;
    }
    return window.openai.requestModal(opts);
  }, []);
}
