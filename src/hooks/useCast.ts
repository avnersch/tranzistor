import { useCallback, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { Station } from '../data/stations';

export interface CastDevice {
  deviceId: string;
  friendlyName: string;
}

export interface CastState {
  isCasting: boolean;
  isConnecting: boolean;
  devices: CastDevice[];
  connectedDeviceName: string | null;
  modalVisible: boolean;
  openModal: () => void;
  closeModal: () => void;
  connectToDevice: (deviceId: string) => void;
  disconnect: () => void;
  castMedia: (station: Station, nowPlaying?: string | null) => void;
  castPlay: () => void;
  castPause: () => void;
}

const ARTWORK_BASE = 'https://proxy-sigma-sand.vercel.app/stations/';

function useNativeCast(): CastState {
  const GoogleCast = require('react-native-google-cast');
  const {
    useDevices,
    useRemoteMediaClient,
    useCastState,
    CastContext,
    PlayServicesState,
  } = GoogleCast;

  const hookDevices: CastDevice[] = useDevices();
  const hookClient = useRemoteMediaClient();
  const hookCastState: string | undefined = useCastState();

  const [isCasting, setIsCasting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    CastContext.getPlayServicesState().then((state: number) => {
      if (state && state !== PlayServicesState.SUCCESS) {
        CastContext.showPlayServicesErrorDialog(state);
      }
    });
  }, []);

  // Detect remote disconnect via useCastState hook
  useEffect(() => {
    if (isCasting && hookCastState && hookCastState !== 'connected' && hookCastState !== 'connecting') {
      setIsCasting(false);
      setConnectedDeviceName(null);
    }
  }, [hookCastState, isCasting]);

  // Native event listener for remote disconnect
  useEffect(() => {
    try {
      const sm = GoogleCast.default.getSessionManager();
      const sub = sm.onSessionEnded(() => {
        setIsCasting(false);
        setConnectedDeviceName(null);
      });
      return () => { try { sub?.remove?.(); } catch {} };
    } catch {
      return undefined;
    }
  }, []);

  // Poll native cast state as a last-resort fallback for remote disconnect
  useEffect(() => {
    if (!isCasting) return;
    const interval = setInterval(async () => {
      try {
        const state = await CastContext.getCastState();
        if (state && state !== 'connected' && state !== 'connecting') {
          setIsCasting(false);
          setConnectedDeviceName(null);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [isCasting]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  // End connecting state when the remote media client becomes available
  useEffect(() => {
    if (isConnecting && hookClient) {
      setIsConnecting(false);
    }
  }, [isConnecting, hookClient]);

  // Timeout: stop showing connecting after 15s
  useEffect(() => {
    if (!isConnecting) return;
    const timeout = setTimeout(() => setIsConnecting(false), 15000);
    return () => clearTimeout(timeout);
  }, [isConnecting]);

  const connectToDevice = useCallback((deviceId: string) => {
    const device = hookDevices.find((d: CastDevice) => d.deviceId === deviceId);
    try {
      GoogleCast.default.getSessionManager().startSession(deviceId);
    } catch {}
    setIsConnecting(true);
    setIsCasting(true);
    setConnectedDeviceName(device?.friendlyName ?? 'Unknown Device');
    setModalVisible(false);
  }, [hookDevices]);

  const disconnect = useCallback(() => {
    try {
      GoogleCast.default.getSessionManager().endCurrentSession(true);
    } catch {}
    setIsConnecting(false);
    setIsCasting(false);
    setConnectedDeviceName(null);
    setModalVisible(false);
  }, []);

  const castMedia = useCallback(
    (station: Station, nowPlaying?: string | null) => {
      if (!hookClient) return;
      hookClient.loadMedia({
        mediaInfo: {
          contentUrl: station.streamUrl,
          contentType: 'audio/mpeg',
          metadata: {
            type: 'musicTrack',
            title: nowPlaying || station.frequency,
            artist: station.name,
            images: [{ url: `${ARTWORK_BASE}${station.id}.png` }],
          },
        },
        autoplay: true,
      });
    },
    [hookClient],
  );

  const castPlay = useCallback(() => {
    hookClient?.play();
  }, [hookClient]);

  const castPause = useCallback(() => {
    hookClient?.pause();
  }, [hookClient]);

  return {
    isCasting,
    isConnecting,
    devices: hookDevices,
    connectedDeviceName,
    modalVisible,
    openModal,
    closeModal,
    connectToDevice,
    disconnect,
    castMedia,
    castPlay,
    castPause,
  };
}

function useWebCast(): CastState {
  const [modalVisible, setModalVisible] = useState(false);
  return {
    isCasting: false,
    isConnecting: false,
    devices: [],
    connectedDeviceName: null,
    modalVisible,
    openModal: () => {
      Alert.alert(
        'Chromecast',
        'Casting is available only in the Android app. Please install the app to cast to nearby devices.',
      );
    },
    closeModal: () => setModalVisible(false),
    connectToDevice: () => {},
    disconnect: () => {},
    castMedia: () => {},
    castPlay: () => {},
    castPause: () => {},
  };
}

export function useCast(): CastState {
  if (Platform.OS === 'web') {
    return useWebCast();
  }
  return useNativeCast();
}
