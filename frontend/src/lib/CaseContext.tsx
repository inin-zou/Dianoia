import { createContext, useContext, type ReactNode } from 'react';
import { useCase } from '@/hooks/useCase';
import type { Case } from '@/types';

// Demo case ID
const DEMO_CASE_ID = 'c0000000-0000-0000-0000-000000000001';

interface CaseContextValue {
  caseId: string;
  caseData: Case | null;
  loading: boolean;
  error: string | null;
}

const CaseContext = createContext<CaseContextValue>({
  caseId: DEMO_CASE_ID,
  caseData: null,
  loading: true,
  error: null,
});

export function CaseProvider({ children }: { children: ReactNode }) {
  const { caseData, loading, error } = useCase(DEMO_CASE_ID);

  return (
    <CaseContext.Provider
      value={{
        caseId: DEMO_CASE_ID,
        caseData,
        loading,
        error,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCaseContext(): CaseContextValue {
  return useContext(CaseContext);
}
