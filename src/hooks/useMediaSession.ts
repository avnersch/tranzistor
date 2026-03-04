import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Station } from '../data/stations';

interface MediaSessionParams {
  station: Station | null;
  isPlaying: boolean;
  nowPlaying: string | null;
  onTogglePlayPause: () => void;
  onStop: () => void;
}

function hasMediaSession(): boolean {
  return Platform.OS === 'web' && typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

function getArtworkUrl(station: Station): string {
  return `${window.location.origin}/stations/${station.id}.png`;
}

export function useMediaSession({ station, isPlaying, nowPlaying, onTogglePlayPause, onStop }: MediaSessionParams) {
  const callbacksRef = useRef({ onTogglePlayPause, onStop });
  callbacksRef.current = { onTogglePlayPause, onStop };

  useEffect(() => {
    if (!hasMediaSession()) return;

    if (!station) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    const title = nowPlaying || station.frequency;
    const artist = station.name;
    const artworkSrc = getArtworkUrl(station);

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      artwork: [
        { src: artworkSrc, sizes: '512x512', type: 'image/png' },
      ],
    });
  }, [station?.id, station?.name, station?.frequency, station?.logoUrl, nowPlaying]);

  useEffect(() => {
    if (!hasMediaSession()) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (!hasMediaSession()) return;

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', () => callbacksRef.current.onTogglePlayPause()],
      ['pause', () => callbacksRef.current.onTogglePlayPause()],
      ['stop', () => callbacksRef.current.onStop()],
    ];

    for (const [action, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
    }

    return () => {
      for (const [action] of handlers) {
        try { navigator.mediaSession.setActionHandler(action, null); } catch { /* ignore */ }
      }
    };
  }, []);
}
