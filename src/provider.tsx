import {
  createInitialState,
  createStore,
  type FamilyCtxSession,
  type Store,
} from "@familyctx/core";
import { FamilyCtxProvider as FamilyCoreCtxProvider } from "@familyctx/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { FamilyCtxExpoProvider as ExpoContextProvider } from "./context";

const SESSION_KEY = "familyctx.session";

type FamilyCtxProviderProps = {
  children: ReactNode;
  onPinRequired?: () => void;
  onAuthFailed?: () => void;
};

export function FamilyCtxProvider({
  children,
  onPinRequired,
  onAuthFailed,
}: FamilyCtxProviderProps) {
  const storeRef = useRef<Store | null>(null);
  const [ready, setReady] = useState(false);

  if (storeRef.current == null) {
    storeRef.current = createStore(createInitialState());
  }

  const store = storeRef.current;

  useEffect(() => {
    async function hydrate() {
      try {
        const raw = await SecureStore.getItemAsync(SESSION_KEY);
        if (raw) {
          const session: FamilyCtxSession = JSON.parse(raw);
          const current = store.getState();
          store.setState({ ...current, session });
        }
      } catch {
        // corrupt or missing. start fresh.
      } finally {
        setReady(true);
      }
    }

    void hydrate();
  }, [store]);

  useEffect(() => {
    return store.subscribe((state) => {
      if (state.session) {
        void SecureStore.setItemAsync(
          SESSION_KEY,
          JSON.stringify(state.session),
        );
      } else {
        void SecureStore.deleteItemAsync(SESSION_KEY);
      }
    });
  }, [store]);

  if (!ready) return null;

  const contextValue = {
    ...(onPinRequired && { onPinRequired }),
    ...(onAuthFailed && { onAuthFailed }),
  };

  return (
    <ExpoContextProvider value={contextValue}>
      <FamilyCoreCtxProvider store={store}>{children}</FamilyCoreCtxProvider>
    </ExpoContextProvider>
  );
}
