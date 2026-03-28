import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CastDevice } from '../hooks/useCast';
import { Colors, Fonts } from '../theme/colors';

interface Props {
  visible: boolean;
  devices: CastDevice[];
  isCasting: boolean;
  connectedDeviceName: string | null;
  onSelectDevice: (deviceId: string) => void;
  onDisconnect: () => void;
  onClose: () => void;
}

const ANIM_DURATION = 300;

export function CastModal({
  visible,
  devices,
  isCasting,
  connectedDeviceName,
  onSelectDevice,
  onDisconnect,
  onClose,
}: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [modalShown, setModalShown] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalShown(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    } else if (modalShown) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setModalShown(false);
      });
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setModalShown(false);
        onClose();
      }
    });
  }, [onClose]);

  const handleDisconnect = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setModalShown(false);
        onDisconnect();
      }
    });
  }, [onDisconnect]);

  if (!modalShown) return null;

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const sheetTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [350, 0],
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.wrapper}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
        >
          <Pressable>
            <View style={styles.handle} />

            <Text style={styles.title}>
              {isCasting ? 'מחובר למכשיר' : 'התחבר למכשיר'}
            </Text>

            {isCasting && connectedDeviceName ? (
              <View style={styles.connectedSection}>
                <View style={styles.deviceRow}>
                  <Image
                    source={require('../../assets/cast-connected-icon.png')}
                    style={styles.deviceIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.deviceName}>{connectedDeviceName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={handleDisconnect}
                  activeOpacity={0.7}
                >
                  <Text style={styles.disconnectText}>התנתק מהמכשיר</Text>
                </TouchableOpacity>
              </View>
            ) : devices.length > 0 ? (
              <View style={styles.deviceList}>
                {devices.map((device) => (
                  <TouchableOpacity
                    key={device.deviceId}
                    style={styles.deviceRow}
                    onPress={() => onSelectDevice(device.deviceId)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require('../../assets/cast-icon.png')}
                      style={[styles.deviceIcon, styles.deviceIconInactive]}
                      resizeMode="contain"
                    />
                    <Text style={styles.deviceName}>
                      {device.friendlyName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Image
                  source={require('../../assets/cast-icon.png')}
                  style={[styles.emptyIcon, styles.deviceIconInactive]}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>
                  מחפש מכשירים ברשת...
                </Text>
                <Text style={styles.emptySubtext}>
                  ודא שמכשיר ה-Chromecast מחובר לאותה רשת WiFi
                </Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.playerBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 56,
    paddingTop: 12,
    minHeight: 200,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.playerText,
    textAlign: 'right',
    marginBottom: 20,
  },
  deviceList: {
    gap: 4,
  },
  connectedSection: {
    gap: 16,
  },
  deviceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  deviceIcon: {
    width: 20,
    height: 20,
    marginLeft: 12,
  },
  deviceIconInactive: {
    tintColor: Colors.playerTextSecondary,
  },
  deviceName: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.playerText,
    textAlign: 'right',
  },
  disconnectButton: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  disconnectText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    opacity: 0.5,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.playerTextSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.playerTextSecondary,
    opacity: 0.7,
    textAlign: 'center',
  },
});
