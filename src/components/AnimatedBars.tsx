import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface Props {
  color?: string;
  size?: number;
}

export function AnimatedBars({ color = '#FFFFFF', size = 18 }: Props) {
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.6)).current;
  const bar3 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animate = (value: Animated.Value, toMin: number, toMax: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: toMax, duration, useNativeDriver: false }),
          Animated.timing(value, { toValue: toMin, duration: duration * 0.8, useNativeDriver: false }),
        ])
      );

    const a1 = animate(bar1, 0.2, 1.0, 400);
    const a2 = animate(bar2, 0.3, 0.8, 500);
    const a3 = animate(bar3, 0.15, 0.95, 350);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [bar1, bar2, bar3]);

  const barWidth = size * 0.2;
  const gap = size * 0.1;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {[bar1, bar2, bar3].map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            {
              width: barWidth,
              borderRadius: barWidth / 2,
              backgroundColor: color,
              marginHorizontal: gap / 2,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [size * 0.15, size * 0.9],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
