import { useCallback, useEffect, useState } from 'react';
import { fetchAllNowPlaying, fetchNowPlaying } from '../services/nowPlaying';

const POLL_INTERVAL_MS = 60_000;

export function useNowPlaying(stationId: string | null): string | null {
  const [showName, setShowName] = useState<string | null>(null);

  useEffect(() => {
    if (!stationId) {
      setShowName(null);
      return;
    }

    setShowName(null);
    let cancelled = false;

    const poll = async () => {
      const name = await fetchNowPlaying(stationId);
      if (!cancelled) setShowName(name);
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [stationId]);

  return showName;
}

interface AllNowPlayingResult {
  data: Record<string, string | null>;
  refresh: () => Promise<void>;
}

export function useAllNowPlaying(stationIds: string[]): AllNowPlayingResult {
  const [showNames, setShowNames] = useState<Record<string, string | null>>({});
  const stationIdsKey = stationIds.join(',');

  const pollAll = useCallback(async (clear = false) => {
    if (clear) setShowNames({});
    const data = await fetchAllNowPlaying();
    setShowNames(data);
  }, [stationIdsKey]);

  const refresh = useCallback(() => pollAll(true), [pollAll]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) await pollAll();
    };

    run();
    const interval = setInterval(run, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [pollAll]);

  return { data: showNames, refresh };
}
