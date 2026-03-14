import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Station } from '../data/stations';
import { STATION_LOGOS } from '../data/stationLogos';
import { ShazamMatch } from '../hooks/useShazamMatch';
import { Colors, Fonts } from '../theme/colors';
import { MarqueeText } from './MarqueeText';

interface Props {
  station: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  nowPlaying: string | null;
  shazamMatch?: ShazamMatch | null;
  onTogglePlayPause: () => void;
  onStop: () => void;
}

function PlayIcon() {
  return (
    <View style={iconStyles.playTriangle}>
      <View style={iconStyles.triangle} />
    </View>
  );
}

function PauseIcon() {
  return (
    <View style={iconStyles.pauseContainer}>
      <View style={iconStyles.pauseBar} />
      <View style={iconStyles.pauseBar} />
    </View>
  );
}

function StopIcon() {
  return <View style={iconStyles.stopSquare} />;
}

export function PlayerBar({
  station,
  isPlaying,
  isLoading,
  nowPlaying,
  shazamMatch,
  onTogglePlayPause,
  onStop,
}: Props) {
  if (!station) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onStop}
        style={styles.stopButton}
        activeOpacity={0.7}
      >
        <StopIcon />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onTogglePlayPause}
        style={styles.playButton}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.stationName} numberOfLines={1}>
          {station.name}
        </Text>
        {nowPlaying && !isLoading ? (
          <View style={styles.nowPlayingRow}>
            <MarqueeText text={nowPlaying} style={styles.frequency} />
            <Text style={styles.frequency}>עכשיו בשידור: </Text>
          </View>
        ) : (
          <Text style={styles.frequency} numberOfLines={1}>
            {isLoading ? 'טוען...' : station.frequency}
          </Text>
        )}
        {shazamMatch && !isLoading && (
          <View style={styles.shazamRow}>
            <MarqueeText
              text={`${shazamMatch.artist}${shazamMatch.title ? ` – ${shazamMatch.title}` : ''}`}
              style={styles.frequency}
            />
            <Text style={styles.shazamEmoji}>🎵 </Text>
          </View>
        )}
      </View>

      <View style={[styles.logoDot, { backgroundColor: '#FFFFFF' }]}>
        <Image
          source={STATION_LOGOS[station.id] ?? { uri: station.logoUrl }}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  playTriangle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },
  pauseContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  pauseBar: {
    width: 4,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  stopSquare: {
    width: 12,
    height: 12,
    backgroundColor: Colors.playerTextSecondary,
    borderRadius: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.playerBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 26,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  logoDot: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 34,
    height: 34,
  },
  info: {
    flex: 1,
    marginRight: 12,
    alignItems: 'flex-end',
  },
  stationName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.playerText,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    marginTop: 2,
    marginLeft: 12,
  },
  shazamRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    marginTop: 1,
    marginLeft: 12,
  },
  shazamEmoji: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.playerTextSecondary,
    flexShrink: 0,
  },
  frequency: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.playerTextSecondary,
    textAlign: 'right',
    flexShrink: 0,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  stopButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
