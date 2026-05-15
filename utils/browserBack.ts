/** Lightweight bridge: browser back invokes the same handler as the in-app Back button. */

const HISTORY_KEY = 'vsBack';

let uiBackHandler: () => void = () => {};
let isPopNavigation = false;
let listenerInstalled = false;

export function setUiBackHandler(handler: () => void) {
  uiBackHandler = handler;
}

export function runUiBackHandler() {
  uiBackHandler();
}

export function pushAppHistoryState(extra: Record<string, unknown> = {}) {
  if (isPopNavigation) return;
  window.history.pushState({ [HISTORY_KEY]: 1, ...extra }, '');
}

export function replaceAppHistoryState(extra: Record<string, unknown> = {}) {
  window.history.replaceState({ [HISTORY_KEY]: 1, ...extra }, '');
}

export function initBrowserBackListener(
  enabled: boolean,
  onPreventExit?: () => void
) {
  if (!enabled || listenerInstalled) return;
  listenerInstalled = true;

  window.addEventListener('popstate', () => {
    if (window.history.state?.[HISTORY_KEY]) {
      isPopNavigation = true;
      uiBackHandler();
      queueMicrotask(() => {
        isPopNavigation = false;
      });
      return;
    }
    onPreventExit?.();
  });
}
