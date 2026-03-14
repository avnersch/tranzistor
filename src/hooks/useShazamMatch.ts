import { useCallback, useEffect, useRef, useState } from 'react';

const SHAZAM_URL = 'https://proxy-sigma-sand.vercel.app/api/shazam';
const POLL_INTERVAL_MS = 15_000;
const FETCH_TIMEOUT_MS = 40_000;

export interface ShazamMatch {
  title: string;
  artist: string;
}

type ShazamData = Record<string, ShazamMatch | null>;

export function useAllShazamMatches(): ShazamData {
  const [data, setData] = useState<ShazamData>({});
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(SHAZAM_URL, { signal: controller.signal });
      if (!res.ok || !mountedRef.current) return;
      const json = await res.json();
      if (!mountedRef.current) return;
      setData(json);
    } catch {
      /* ignore */
    } finally {
      clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [poll]);

  return data;
}
