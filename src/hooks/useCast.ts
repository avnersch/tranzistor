import { useCallback, useEffect, useRef, useState } from 'react';
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
  castMedia: (station: Station, nowPlaying?: string | null) => Promise<boolean>;
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

  // Store pending device name until session actually starts
  const pendingDeviceNameRef = useRef<string | null>(null);

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

  // Native event listeners for session lifecycle
  useEffect(() => {
    try {
      const sm = GoogleCast.default.getSessionManager();

      // Session successfully started
      const startSub = sm.onSessionStarted(() => {
        setIsConnecting(false);
        setIsCasting(true);
        // Use pending device name, or fallback to a default
        setConnectedDeviceName(pendingDeviceNameRef.current || 'מכשיר מחובר');
        pendingDeviceNameRef.current = null;
      });

      // Session failed to start
      const failSub = sm.onSessionStartFailed((error: unknown) => {
        console.warn('Cast session failed to start:', error);
        setIsConnecting(false);
        setIsCasting(false);
        setConnectedDeviceName(null);
        pendingDeviceNameRef.current = null;
        Alert.alert(
          'החיבור נכשל',
          'לא הצלחנו להתחבר למכשיר. נסה שוב.',
          [{ text: 'אישור' }]
        );
      });

      // Session ended (remote disconnect or user disconnect)
      const endSub = sm.onSessionEnded(() => {
        setIsCasting(false);
        setConnectedDeviceName(null);
      });

      return () => {
        try { startSub?.remove?.(); } catch {}
        try { failSub?.remove?.(); } catch {}
        try { endSub?.remove?.(); } catch {}
      };
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

  // Timeout: stop showing connecting spinner after 20s
  // Don't clear pendingDeviceNameRef - the session might still start afterward (slow devices like Mi Box)
  // Don't show alert - just silently stop the spinner, connection may still succeed
  useEffect(() => {
    if (!isConnecting) return;
    const timeout = setTimeout(() => {
      setIsConnecting(false);
      // Note: Don't clear pendingDeviceNameRef here - onSessionStarted may still fire
    }, 20000);
    return () => clearTimeout(timeout);
  }, [isConnecting]);

  const connectToDevice = useCallback((deviceId: string) => {
    const device = hookDevices.find((d: CastDevice) => d.deviceId === deviceId);
    // Store device name - will be used when session actually starts
    pendingDeviceNameRef.current = device?.friendlyName ?? 'Unknown Device';
    setIsConnecting(true);
    setModalVisible(false);
    // Don't set isCasting here - wait for onSessionStarted event
    try {
      GoogleCast.default.getSessionManager().startSession(deviceId);
    } catch (e) {
      console.warn('Failed to start cast session:', e);
      setIsConnecting(false);
      pendingDeviceNameRef.current = null;
    }
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
    async (station: Station, nowPlaying?: string | null): Promise<boolean> => {
      // Retry logic - RemoteMediaClient may not be immediately available after session starts
      let client = hookClient;
      let attempts = 0;
      const maxAttempts = 10;
      const retryDelay = 300;

      while (!client && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        try {
          client = GoogleCast.default.getClient();
        } catch {}
        attempts++;
      }

      if (!client) {
        console.warn('Cast client not available after', maxAttempts, 'attempts');
        return false;
      }

      try {
        await client.loadMedia({
          mediaInfo: {
            contentUrl: station.streamUrl,
            contentType: 'audio/mpeg',
            streamType: 'live', // Important for live radio streams
            metadata: {
              type: 'musicTrack',
              title: nowPlaying || station.frequency,
              artist: station.name,
              images: [{ url: `${ARTWORK_BASE}${station.id}.png` }],
            },
          },
          autoplay: true,
        });
        return true;
      } catch (e) {
        console.warn('Failed to load cast media:', e);
        return false;
      }
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
    castMedia: async () => false,
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
