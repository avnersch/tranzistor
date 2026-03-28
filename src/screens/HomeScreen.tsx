import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { CastModal } from '../components/CastModal';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAllNowPlaying } from '../hooks/useNowPlaying';
import { useMediaSession } from '../hooks/useMediaSession';
import { useAllShazamMatches } from '../hooks/useShazamMatch';
import { useCast } from '../hooks/useCast';
import { Colors, Fonts } from '../theme/colors';

const stationIds = stations.map((s) => s.id);

export function HomeScreen() {
  const player = useAudioPlayer();
  const cast = useCast();
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

  const [castPaused, setCastPaused] = useState(false);

  const handleTogglePlayPause = useCallback(() => {
    if (cast.isCasting) {
      if (castPaused) {
        cast.castPlay();
        setCastPaused(false);
      } else {
        cast.castPause();
        setCastPaused(true);
      }
    } else {
      player.togglePlayPause();
    }
  }, [cast.isCasting, castPaused, cast.castPlay, cast.castPause, player.togglePlayPause]);

  useMediaSession({
    station: player.currentStation,
    isPlaying: player.isPlaying,
    nowPlaying,
    onTogglePlayPause: handleTogglePlayPause,
    onStop: player.stop,
  });

  const wasCastingRef = useRef(false);

  useEffect(() => {
    if (cast.isCasting && player.currentStation) {
      if (player.isPlaying) {
        player.togglePlayPause();
      }
      cast.castMedia(player.currentStation, nowPlaying);
      setCastPaused(false);
    }

    if (!cast.isCasting) {
      setCastPaused(false);
      if (wasCastingRef.current && player.currentStation) {
        player.play(player.currentStation);
      }
    }

    wasCastingRef.current = cast.isCasting;
  }, [cast.isCasting]);

  const handleStationPress = (station: Station) => {
    if (cast.isCasting) {
      player.setStation(station);
      cast.castMedia(station, allNowPlaying[station.id] ?? null);
      setCastPaused(false);
      return;
    }
    if (player.currentStation?.id === station.id && player.isPlaying) {
      player.togglePlayPause();
    } else {
      player.play(station);
    }
  };

  const effectiveIsPlaying = cast.isCasting ? !castPaused : player.isPlaying;

  const renderStation = ({ item }: { item: Station }) => {
    const isActive = player.currentStation?.id === item.id;
    return (
      <StationCard
        station={item}
        isPlaying={isActive && (effectiveIsPlaying || player.isLoading)}
        isLoading={isActive && player.isLoading}
        subtitle={allNowPlaying[item.id] || item.frequency}
        isSubtitleLoading={allNowPlaying[item.id] === undefined}
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
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
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
        isPlaying={effectiveIsPlaying}
        isLoading={player.isLoading}
        nowPlaying={nowPlaying}
        shazamMatch={allShazam[player.currentStation?.id ?? ''] ?? null}
        onTogglePlayPause={handleTogglePlayPause}
        onCast={cast.openModal}
        isCasting={cast.isCasting}
        isConnecting={cast.isConnecting}
      />

      <CastModal
        visible={cast.modalVisible}
        devices={cast.devices}
        isCasting={cast.isCasting}
        connectedDeviceName={cast.connectedDeviceName}
        onSelectDevice={cast.connectToDevice}
        onDisconnect={cast.disconnect}
        onClose={cast.closeModal}
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
    marginTop: 4,
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
  row: {
    flexDirection: 'row-reverse',
  },
});
