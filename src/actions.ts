import { useActions as useReactActions } from "@familyctx/react";
import { useMemo, useRef } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { useFamilyCtxExpoContext } from "./context";

export function useActions() {
  const reactActions = useReactActions();
  const { onPinRequired, onAuthFailed } = useFamilyCtxExpoContext();
  const pendingAuthRef = useRef(false);

  return useMemo(() => {
    const authenticateForParentMode = async () => {
      // Try biometrics first
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        try {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Authenticate to enable parent mode",
            disableDeviceFallback: true, // Don't fall back to device PIN
          });

          if (result.success) {
            // Biometric auth succeeded - enable immediately
            reactActions.session.enableParentMode();
            return;
          }
        } catch {
          // Biometric error - fall through to custom PIN
        }
      }

      // Biometrics failed or unavailable - request custom PIN
      pendingAuthRef.current = true;
      onPinRequired?.();
    };

    return {
      profile: reactActions.profile,
      account: reactActions.account,
      session: {
        ...reactActions.session,
        enableParentMode: () => {
          void authenticateForParentMode();
        },
        confirmParentMode: () => {
          // Consumer calls this after custom PIN verification
          if (pendingAuthRef.current) {
            pendingAuthRef.current = false;
            reactActions.session.enableParentMode();
          }
        },
        cancelParentMode: () => {
          // Consumer calls this if PIN was cancelled/incorrect
          if (pendingAuthRef.current) {
            pendingAuthRef.current = false;
            onAuthFailed?.();
          }
        },
      },
    };
  }, [reactActions, onPinRequired, onAuthFailed]);
}
