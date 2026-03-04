import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  width: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SHIMMER_WIDTH = 300;

export function ShimmerLine({ width, height = 10, borderRadius = 4, style }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_WIDTH, SHIMMER_WIDTH],
  });

  return (
    <Animated.View style={[styles.container, { width: width as any, height, borderRadius }, style]}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          left: translateX,
          width: SHIMMER_WIDTH,
        }}
      >
        <LinearGradient
          colors={['rgba(180,210,240,0)', 'rgba(180,210,240,0.7)', 'rgba(180,210,240,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D6E4F0',
    overflow: 'hidden',
  },
});
