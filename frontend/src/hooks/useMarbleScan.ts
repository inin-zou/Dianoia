import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MarbleScan } from '@/types';

/**
 * Convert snake_case DB row to camelCase MarbleScan object.
 */
function mapScanRow(row: Record<string, unknown>): MarbleScan {
  return {
    id: row.id as string,
    caseId: (row.case_id as string) || '',
    worldId: (row.world_id as string) || null,
    status: (row.status as MarbleScan['status']) || 'processing',
    embedUrl: (row.embed_url as string) || null,
    meshExportUrl: (row.mesh_export_url as string) || null,
    splatExportUrl: (row.splat_export_url as string) || null,
    renderedViews: (row.rendered_views as MarbleScan['renderedViews']) || [],
    createdAt: row.created_at as string,
  };
}

/**
 * Hook to get the latest Marble scan for a case.
 * Subscribes to real-time updates so the UI reacts when scan completes.
 */
export function useMarbleScan(caseId: string | null): {
  scan: MarbleScan | null;
  loading: boolean;
  error: string | null;
} {
  const [scan, setScan] = useState<MarbleScan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setScan(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchScan() {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('marble_scans')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (fetchErr) {
        setError(fetchErr.message);
        setLoading(false);
        return;
      }

      setScan(data ? mapScanRow(data as Record<string, unknown>) : null);
      setLoading(false);
    }

    fetchScan();

    // Subscribe to marble_scans changes for this case
    const channel = supabase
      .channel(`marble_scans_${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marble_scans',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          if (cancelled) return;
          const { eventType } = payload;

          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const row = payload.new as Record<string, unknown>;
            setScan(mapScanRow(row));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  return { scan, loading, error };
}
