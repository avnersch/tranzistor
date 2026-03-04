import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@tranzistor_favorites';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((data) => {
      if (data) {
        setFavoriteIds(new Set(JSON.parse(data)));
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(async (ids: Set<string>) => {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
  }, []);

  const toggleFavorite = useCallback(
    (stationId: string) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(stationId)) {
          next.delete(stationId);
        } else {
          next.add(stationId);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isFavorite = useCallback(
    (stationId: string) => favoriteIds.has(stationId),
    [favoriteIds]
  );

  return { favoriteIds, toggleFavorite, isFavorite, loaded };
}
