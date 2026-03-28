import { useRealtimeTable } from './useRealtimeTable';
import type { SuspectProfile } from '@/types';

export function useProfiles(caseId: string | null) {
  return useRealtimeTable<SuspectProfile>('suspect_profiles', caseId);
}
