import { useRealtimeTable } from './useRealtimeTable';
import type { Evidence } from '@/types';

export function useEvidence(caseId: string | null) {
  return useRealtimeTable<Evidence>('evidence', caseId);
}
