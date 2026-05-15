import { useEffect, type DependencyList } from 'react';
import { setUiBackHandler } from '../utils/browserBack';

/** Register the active screen's in-app Back handler for browser/mobile back. */
export function useRegisterUiBack(handler: () => void, deps: DependencyList) {
  useEffect(() => {
    setUiBackHandler(handler);
    return () => {
      setUiBackHandler(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
