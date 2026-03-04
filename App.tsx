import { useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  NotoSansHebrew_400Regular,
  NotoSansHebrew_500Medium,
  NotoSansHebrew_600SemiBold,
  NotoSansHebrew_700Bold,
  NotoSansHebrew_800ExtraBold,
} from '@expo-google-fonts/noto-sans-hebrew';
import { HomeScreen } from './src/screens/HomeScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    'NotoSansHebrew-Regular': NotoSansHebrew_400Regular,
    'NotoSansHebrew-Medium': NotoSansHebrew_500Medium,
    'NotoSansHebrew-SemiBold': NotoSansHebrew_600SemiBold,
    'NotoSansHebrew-Bold': NotoSansHebrew_700Bold,
    'NotoSansHebrew-ExtraBold': NotoSansHebrew_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <HomeScreen />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
