import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { EDGE_FUNCTION_TIMEOUT_MS } from '@/constants/config';

type AnalyzeResult = {
  scanId: string;
};

type ErrorCode = 'scan_limit_reached' | 'timeout' | 'unknown';

function mapError(code: ErrorCode): string {
  switch (code) {
    case 'scan_limit_reached':
      return 'You have reached your free scan limit. Upgrade to Pro for unlimited scans.';
    case 'timeout':
      return 'Analysis took too long. Please try again with a clearer image.';
    default:
      return 'Something went wrong analyzing your contract. Please try again.';
  }
}

const PROGRESS_STEPS = [0, 30, 60, 85, 100];

export function useAnalyzeContract() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<{ message: string; code: ErrorCode } | null>(null);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startProgressSimulation() {
    let stepIndex = 0;
    setProgress(PROGRESS_STEPS[0]);
    const delays = [0, 3000, 8000, 18000]; // ms until each step transition
    delays.forEach((delay, i) => {
      setTimeout(() => {
        setProgress(PROGRESS_STEPS[i + 1] ?? PROGRESS_STEPS[i]);
      }, delay + 500);
    });
  }

  function stopProgressSimulation() {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  async function analyze(base64: string, mimeType: string = 'image/jpeg'): Promise<AnalyzeResult | null> {
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    startProgressSimulation();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw { code: 'unknown' as ErrorCode };
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), EDGE_FUNCTION_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(`${supabaseUrl}/functions/v1/analyze-contract`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image_base64: base64, mime_type: mimeType }),
          signal: controller.signal,
        });
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw { code: 'timeout' as ErrorCode };
        }
        throw { code: 'unknown' as ErrorCode };
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 403) {
        const body = await response.json().catch(() => ({}));
        const code: ErrorCode =
          body?.error === 'scan_limit_reached' ? 'scan_limit_reached' : 'unknown';
        throw { code };
      }

      if (!response.ok) {
        throw { code: 'unknown' as ErrorCode };
      }

      const data = await response.json();
      setProgress(100);
      return { scanId: data.id as string };
    } catch (err: unknown) {
      const code: ErrorCode =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code: ErrorCode }).code
          : 'unknown';
      setError({ message: mapError(code), code });
      return null;
    } finally {
      stopProgressSimulation();
      setIsAnalyzing(false);
    }
  }

  return { analyze, isAnalyzing, error, progress };
}
