import { useEffect, useRef, useState } from 'react';
import { stations, Station } from '../data/stations';

const STREAMS_URL = 'https://proxy-sigma-sand.vercel.app/api/streams';

export function useStations(): Station[] {
  const [overrides, setOverrides] = useState<Record<string, string> | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch(STREAMS_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === 'object') {
          setOverrides(data);
        }
      })
      .catch(() => {});
  }, []);

  if (!overrides) return stations;

  return stations.map((s) => {
    const url = overrides[s.id];
    return url && url !== s.streamUrl ? { ...s, streamUrl: url } : s;
  });
}
