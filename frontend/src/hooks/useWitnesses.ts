import { useRealtimeTable } from './useRealtimeTable';
import type { Witness } from '@/types';

export function useWitnesses(caseId: string | null) {
  return useRealtimeTable<Witness>('witnesses', caseId);
}
