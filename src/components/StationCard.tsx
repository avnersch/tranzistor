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
import { Colors, Fonts } from '../theme/colors';
import { AnimatedBars } from './AnimatedBars';
import { ShimmerLine } from './ShimmerLine';

interface Props {
  station: Station;
  isPlaying: boolean;
  isLoading: boolean;
  subtitle: string;
  isSubtitleLoading?: boolean;
  onPress: () => void;
}

export function StationCard({
  station,
  isPlaying,
  isLoading,
  subtitle,
  isSubtitleLoading,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, isPlaying && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={STATION_LOGOS[station.id] ?? { uri: station.logoUrl }}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.nameRow}>
        {isPlaying && (
          <View style={styles.indicator}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <AnimatedBars color={Colors.primary} size={14} />
            )}
          </View>
        )}
        <Text style={[styles.name, isPlaying && styles.nameActive]} numberOfLines={1}>
          {station.name}
        </Text>
      </View>

      {isSubtitleLoading ? (
        <ShimmerLine width={80} height={10} borderRadius={4} style={{ marginTop: 4 }} />
      ) : (
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 140,
  },
  cardActive: {
    backgroundColor: '#EBF5FF',
    borderColor: Colors.primary,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    flexShrink: 1,
  },
  nameActive: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: 3,
    textAlign: 'center',
  },
  indicator: {
    marginRight: 2,
  },
});
