import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Convert snake_case DB row to camelCase for frontend consumption.
 * Handles nested objects (JSONB columns are already parsed by PostgREST).
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function mapKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[snakeToCamel(key)] = obj[key];
  }
  return result;
}

/**
 * Generic hook that subscribes to Supabase postgres_changes for a table
 * filtered by case_id. Returns the live data array and auto-updates on
 * INSERT/UPDATE/DELETE.
 */
export function useRealtimeTable<T>(
  table: string,
  caseId: string | null
): { data: T[]; loading: boolean; error: string | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Initial fetch
    async function fetchData() {
      setLoading(true);
      setError(null);
      const { data: rows, error: fetchErr } = await supabase
        .from(table)
        .select('*')
        .eq('case_id', caseId);

      if (cancelled) return;

      if (fetchErr) {
        setError(fetchErr.message);
        setLoading(false);
        return;
      }

      setData((rows || []).map((row) => mapKeys(row as Record<string, unknown>) as T));
      setLoading(false);
    }

    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel(`${table}_${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `case_id=eq.${caseId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (cancelled) return;
          const { eventType } = payload;

          if (eventType === 'INSERT') {
            const newRow = mapKeys(payload.new as Record<string, unknown>) as T;
            setData((prev) => [...prev, newRow]);
          } else if (eventType === 'UPDATE') {
            const updated = mapKeys(payload.new as Record<string, unknown>) as T;
            setData((prev) =>
              prev.map((item) =>
                (item as Record<string, unknown>).id === (updated as Record<string, unknown>).id
                  ? updated
                  : item
              )
            );
          } else if (eventType === 'DELETE') {
            const oldId = (payload.old as Record<string, unknown>).id;
            setData((prev) =>
              prev.filter((item) => (item as Record<string, unknown>).id !== oldId)
            );
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [table, caseId]);

  return { data, loading, error };
}
