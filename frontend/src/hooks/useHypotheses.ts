import { useRealtimeTable } from './useRealtimeTable';
import type { Hypothesis } from '@/types';

export function useHypotheses(caseId: string | null) {
  return useRealtimeTable<Hypothesis>('hypotheses', caseId);
}
