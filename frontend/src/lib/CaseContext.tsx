import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useCase } from '@/hooks/useCase';
import { supabase } from '@/lib/supabase';
import type { Case } from '@/types';

// Demo case ID
const DEMO_CASE_ID = 'c0000000-0000-0000-0000-000000000001';

interface CaseContextValue {
  caseId: string;
  caseData: Case | null;
  loading: boolean;
  error: string | null;
  allCases: { id: string; title: string; status: string }[];
  switchCase: (id: string) => void;
}

const CaseContext = createContext<CaseContextValue>({
  caseId: DEMO_CASE_ID,
  caseData: null,
  loading: true,
  error: null,
  allCases: [],
  switchCase: () => {},
});

export function CaseProvider({ children }: { children: ReactNode }) {
  const [caseId, setCaseId] = useState(DEMO_CASE_ID);
  const [allCases, setAllCases] = useState<{ id: string; title: string; status: string }[]>([]);
  const { caseData, loading, error } = useCase(caseId);

  // Load all cases for the switcher
  useEffect(() => {
    async function fetchCases() {
      const { data } = await supabase
        .from('cases')
        .select('id, title, status')
        .order('created_at', { ascending: false });
      if (data) {
        setAllCases(data as { id: string; title: string; status: string }[]);
      }
    }
    fetchCases();

    // Subscribe to new cases
    const channel = supabase
      .channel('all-cases')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cases' }, (payload) => {
        if (payload.new) {
          const c = payload.new as { id: string; title: string; status: string };
          setAllCases((prev) => [c, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const switchCase = (id: string) => {
    setCaseId(id);
  };

  return (
    <CaseContext.Provider
      value={{ caseId, caseData, loading, error, allCases, switchCase }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCaseContext(): CaseContextValue {
  return useContext(CaseContext);
}
