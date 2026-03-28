import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Case } from '@/types';

/**
 * Convert snake_case DB row to camelCase Case object.
 */
function mapCaseRow(row: Record<string, unknown>): Case {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    status: (row.status as Case['status']) || 'active',
    marbleWorldId: (row.marble_world_id as string) || null,
    blueprintData: (row.blueprint_data as Case['blueprintData']) || null,
    roomDescription: (row.room_description as Case['roomDescription']) || null,
    scaleFactor: (row.scale_factor as number) || 1.0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useCase(caseId: string | null): {
  caseData: Case | null;
  loading: boolean;
  error: string | null;
} {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setCaseData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchCase() {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (cancelled) return;

      if (fetchErr) {
        setError(fetchErr.message);
        setLoading(false);
        return;
      }

      setCaseData(data ? mapCaseRow(data as Record<string, unknown>) : null);
      setLoading(false);
    }

    fetchCase();

    // Subscribe to case updates
    const channel = supabase
      .channel(`case_${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cases',
          filter: `id=eq.${caseId}`,
        },
        (payload) => {
          if (cancelled) return;
          if (payload.new) {
            setCaseData(mapCaseRow(payload.new as Record<string, unknown>));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  return { caseData, loading, error };
}
