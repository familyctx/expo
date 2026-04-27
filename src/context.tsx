import { createContext, useContext } from "react";

type FamilyCtxExpoContextValue = {
  onPinRequired?: () => void;
  onAuthFailed?: () => void;
};

const FamilyCtxExpoContext = createContext<FamilyCtxExpoContextValue>({});

export const FamilyCtxExpoProvider = FamilyCtxExpoContext.Provider;

export function useFamilyCtxExpoContext(): FamilyCtxExpoContextValue {
  return useContext(FamilyCtxExpoContext);
}
