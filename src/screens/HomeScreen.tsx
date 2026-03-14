import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { stations, Station } from '../data/stations';
import { StationCard } from '../components/StationCard';
import { PlayerBar } from '../components/PlayerBar';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAllNowPlaying } from '../hooks/useNowPlaying';
import { useMediaSession } from '../hooks/useMediaSession';
import { useAllShazamMatches } from '../hooks/useShazamMatch';
import { Colors, Fonts } from '../theme/colors';

const stationIds = stations.map((s) => s.id);

export function HomeScreen() {
  const player = useAudioPlayer();
  const { data: allNowPlaying, refresh } = useAllNowPlaying(stationIds);
  const nowPlaying = allNowPlaying[player.currentStation?.id ?? ''] ?? null;
  const allShazam = useAllShazamMatches();
  const isShazamLoading = Object.keys(allShazam).length === 0;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useEffect(() => {
    player.updateMetadata({ nowPlaying });
  }, [nowPlaying, player.updateMetadata]);

  useMediaSession({
    station: player.currentStation,
    isPlaying: player.isPlaying,
    nowPlaying,
    onTogglePlayPause: player.togglePlayPause,
    onStop: player.stop,
  });

  const handleStationPress = (station: Station) => {
    if (player.currentStation?.id === station.id && player.isPlaying) {
      player.togglePlayPause();
    } else {
      player.play(station);
    }
  };

  const renderStation = ({ item }: { item: Station }) => {
    const isActive = player.currentStation?.id === item.id;
    return (
      <StationCard
        station={item}
        isPlaying={isActive && (player.isPlaying || player.isLoading)}
        isLoading={isActive && player.isLoading}
        subtitle={allNowPlaying[item.id] || item.frequency}
        isSubtitleLoading={allNowPlaying[item.id] === undefined}
        shazamMatch={allShazam[item.id] ?? null}
        isShazamLoading={isShazamLoading}
        onPress={() => handleStationPress(item)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {Platform.OS === 'web' && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} activeOpacity={0.6}>
              {refreshing ? (
                <ActivityIndicator size="small" color={Colors.textSecondary} />
              ) : (
                <Text style={styles.refreshIcon}>↻</Text>
              )}
            </TouchableOpacity>
          )}
          <View style={styles.titleRow}>
            <Text style={styles.title}>טרנזיסטור</Text>
            <Image source={require('../../assets/tranzistor-icon.png')} style={styles.titleIcon} resizeMode="contain" />
          </View>
        </View>
      </View>

      {player.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{player.error}</Text>
        </View>
      )}

      <FlatList
        data={stations}
        renderItem={renderStation}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        extraData={{ allNowPlaying, allShazam }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />

      <PlayerBar
        station={player.currentStation}
        isPlaying={player.isPlaying}
        isLoading={player.isLoading}
        nowPlaying={nowPlaying}
        shazamMatch={allShazam[player.currentStation?.id ?? ''] ?? null}
        onTogglePlayPause={player.togglePlayPause}
        onStop={player.stop}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 'auto',
  },
  refreshIcon: {
    fontSize: 22,
    color: Colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    width: 40,
    height: 40,
    marginLeft: 8,
    marginTop: -4,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.extraBold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  errorBanner: {
    backgroundColor: Colors.error,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
});
