import { useActions as useReactActions } from "@familyctx/react";
import { useMemo, useRef } from "react";
import { useFamilyCtxExpoContext } from "./context";

export function useActions() {
  const reactActions = useReactActions();
  const { onPinRequired, onAuthFailed } = useFamilyCtxExpoContext();
  const pendingAuthRef = useRef(false);

  return useMemo(() => {
    return {
      profile: reactActions.profile,
      account: reactActions.account,
      session: {
        ...reactActions.session,
        enableParentMode: () => {
          // Request auth from consumer
          pendingAuthRef.current = true;
          onPinRequired?.();
        },
        confirmParentMode: () => {
          // Consumer call after successful auth
          if (pendingAuthRef.current) {
            pendingAuthRef.current = false;
            reactActions.session.enableParentMode();
          }
        },
        cancelParentMode: () => {
          // Consumer call if auth was cancelled
          if (pendingAuthRef.current) {
            pendingAuthRef.current = false;
            onAuthFailed?.();
          }
        },
      },
    };
  }, [reactActions, onPinRequired, onAuthFailed]);
}
