import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Scan } from '@/types/database';

export function useScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setScans(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch scans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getScan = useCallback(async (id: string): Promise<Scan | null> => {
    const { data, error: err } = await supabase
      .from('scans')
      .select('*, clauses(*)')
      .eq('id', id)
      .single();
    if (err) return null;
    return data as Scan;
  }, []);

  const deleteScan = useCallback(async (id: string): Promise<void> => {
    await supabase.from('scans').delete().eq('id', id);
    setScans((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { scans, isLoading, error, fetchScans, getScan, deleteScan };
}
