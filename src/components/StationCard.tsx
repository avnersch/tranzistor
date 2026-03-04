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
      <View style={styles.logoContainer}>
        <Image
          source={STATION_LOGOS[station.id] ?? { uri: station.logoUrl }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, isPlaying && styles.nameActive]} numberOfLines={1}>
          {station.name}
        </Text>
        {isSubtitleLoading ? (
          <ShimmerLine width={90} height={10} borderRadius={4} style={{ marginTop: 4, alignSelf: 'flex-end' }} />
        ) : (
          <Text style={styles.frequency} numberOfLines={1}>{subtitle}</Text>
        )}
      </View>

      {isPlaying && (
        <View style={styles.indicator}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <AnimatedBars color={Colors.primary} size={22} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardActive: {
    backgroundColor: '#EBF5FF',
    borderColor: Colors.primary,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8D8E8',
  },
  logo: {
    width: 40,
    height: 40,
  },
  info: {
    flex: 1,
    marginLeft: 10,
    marginRight: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  nameActive: {
    color: Colors.primary,
  },
  frequency: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: 2,
    textAlign: 'right',
  },
  indicator: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
