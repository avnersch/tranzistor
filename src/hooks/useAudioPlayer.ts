import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Station } from '../data/stations';

interface AudioPlayerState {
  currentStation: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

interface NowPlayingInfo {
  nowPlaying: string | null;
}

let useNativeAudio: (() => {
  state: AudioPlayerState;
  play: (station: Station) => Promise<void>;
  stop: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  updateMetadata: (info: NowPlayingInfo) => void;
}) | null = null;

let useWebAudio: typeof useNativeAudio = null;

// --- Web implementation (expo-av) ---
function createWebAudioHook() {
  const { Audio, } = require('expo-av');
  type AVPlaybackStatus = import('expo-av').AVPlaybackStatus;

  return function useWebAudioPlayer() {
    const soundRef = useRef<any>(null);
    const generationRef = useRef(0);
    const [state, setState] = useState<AudioPlayerState>({
      currentStation: null,
      isPlaying: false,
      isLoading: false,
      error: null,
    });

    useEffect(() => {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      return () => { soundRef.current?.unloadAsync(); };
    }, []);

    const play = useCallback(async (station: Station) => {
      const gen = ++generationRef.current;
      setState({ currentStation: station, isPlaying: false, isLoading: true, error: null });
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        if (gen !== generationRef.current) return;
        const { sound } = await Audio.Sound.createAsync(
          { uri: station.streamUrl },
          { shouldPlay: true },
          (status: AVPlaybackStatus) => {
            if (gen !== generationRef.current) return;
            if (!status.isLoaded) {
              if (status.error) {
                setState((prev: AudioPlayerState) => ({ ...prev, isPlaying: false, isLoading: false, error: `Playback error: ${status.error}` }));
              }
              return;
            }
            setState((prev: AudioPlayerState) => ({
              ...prev,
              isPlaying: status.isPlaying,
              isLoading: !status.isPlaying && prev.isLoading && status.isBuffering,
            }));
          }
        );
        if (gen !== generationRef.current) { await sound.unloadAsync(); return; }
        soundRef.current = sound;
      } catch (err: any) {
        if (gen !== generationRef.current) return;
        setState((prev: AudioPlayerState) => ({ ...prev, isPlaying: false, isLoading: false, error: err.message || 'Failed to play station' }));
      }
    }, []);

    const stop = useCallback(async () => {
      generationRef.current++;
      try {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setState({ currentStation: null, isPlaying: false, isLoading: false, error: null });
      } catch { /* ignore */ }
    }, []);

    const togglePlayPause = useCallback(async () => {
      if (!soundRef.current || !state.currentStation) return;
      try {
        if (state.isPlaying) await soundRef.current.pauseAsync();
        else await soundRef.current.playAsync();
      } catch { /* ignore */ }
    }, [state.isPlaying, state.currentStation]);

    const updateMetadata = useCallback((_info: NowPlayingInfo) => {
      // Web uses useMediaSession hook instead
    }, []);

    return { state, play, stop, togglePlayPause, updateMetadata };
  };
}

// --- Native implementation (expo-audio) ---

const ARTWORK_BASE = 'https://proxy-sigma-sand.vercel.app/stations/';
const ARTWORK_URLS: Record<string, string> = {
  'kan88': `${ARTWORK_BASE}kan88.png`,
  'galgalatz': `${ARTWORK_BASE}galgalatz.png`,
  'reshet-bet': `${ARTWORK_BASE}reshet-bet.png`,
  'radius-nostalgi': `${ARTWORK_BASE}radius-nostalgi.png`,
  'galei-tzahal': `${ARTWORK_BASE}galei-tzahal.png`,
  'kol-hamusika': `${ARTWORK_BASE}kol-hamusika.png`,
  'eco99': `${ARTWORK_BASE}eco99.png`,
  'radio-tel-aviv': `${ARTWORK_BASE}radio-tel-aviv.png`,
  '103fm': `${ARTWORK_BASE}103fm.png`,
};

function createNativeAudioHook() {
  const { useAudioPlayer: useExpoPlayer, useAudioPlayerStatus, setAudioModeAsync } = require('expo-audio');

  return function useNativeAudioPlayer() {
    const player = useExpoPlayer(null);
    const status = useAudioPlayerStatus(player);
    const stationRef = useRef<Station | null>(null);
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPlaying = status.playing ?? false;

    useEffect(() => {
      setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers',
      });
    }, []);

    useEffect(() => {
      if (status.error) {
        setError(`Playback error: ${status.error}`);
        setIsLoading(false);
      }
    }, [status.error]);

    useEffect(() => {
      if (isPlaying && isLoading) {
        setIsLoading(false);
      }
    }, [isPlaying, isLoading]);

    const isActiveRef = useRef(false);

    const applyMetadata = useCallback((station: Station, showName?: string | null) => {
      if (!player) return;
      try {
        const meta = {
          title: showName || station.frequency,
          artist: station.name,
          artworkUrl: ARTWORK_URLS[station.id],
        };
        if (!isActiveRef.current) {
          player.setActiveForLockScreen(true, meta);
          isActiveRef.current = true;
        } else {
          player.updateLockScreenMetadata(meta);
        }
      } catch { /* ignore */ }
    }, [player]);

    const play = useCallback(async (station: Station) => {
      stationRef.current = station;
      setCurrentStation(station);
      setIsLoading(true);
      setError(null);

      try {
        player.pause();
        player.replace({ uri: station.streamUrl });
        applyMetadata(station);
        player.play();
      } catch (err: any) {
        setIsLoading(false);
        setError(err.message || 'Failed to play station');
      }
    }, [player, applyMetadata]);

    const stop = useCallback(async () => {
      stationRef.current = null;
      try {
        player.pause();
        player.setActiveForLockScreen(false);
        isActiveRef.current = false;
        player.replace(null);
      } catch { /* ignore */ }
      setCurrentStation(null);
      setIsLoading(false);
      setError(null);
    }, [player]);

    const togglePlayPause = useCallback(async () => {
      if (!currentStation) return;
      try {
        if (isPlaying) player.pause();
        else player.play();
      } catch { /* ignore */ }
    }, [player, isPlaying, currentStation]);

    const updateMetadata = useCallback((info: NowPlayingInfo) => {
      if (stationRef.current) {
        applyMetadata(stationRef.current, info.nowPlaying);
      }
    }, [applyMetadata]);

    const state: AudioPlayerState = {
      currentStation,
      isPlaying,
      isLoading,
      error,
    };

    return { state, play, stop, togglePlayPause, updateMetadata };
  };
}

export function useAudioPlayer() {
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    if (!useWebAudio) useWebAudio = createWebAudioHook();
    const { state, play, stop, togglePlayPause, updateMetadata } = useWebAudio();
    return { ...state, play, stop, togglePlayPause, updateMetadata };
  } else {
    if (!useNativeAudio) useNativeAudio = createNativeAudioHook();
    const { state, play, stop, togglePlayPause, updateMetadata } = useNativeAudio();
    return { ...state, play, stop, togglePlayPause, updateMetadata };
  }
}
