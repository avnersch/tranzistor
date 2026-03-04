import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Text, TextStyle, LayoutChangeEvent } from 'react-native';

interface Props {
  text: string;
  style?: TextStyle;
}

const SPEED = 30;
const PAUSE_MS = 2500;
const RETURN_SPEED = 60;

export function MarqueeText({ text, style }: Props) {
  const containerWidth = useRef(0);
  const textWidth = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const [measured, setMeasured] = useState(false);

  const startAnimation = useCallback(() => {
    animRef.current?.stop();
    const overflow = textWidth.current - containerWidth.current;
    if (overflow <= 0 || containerWidth.current === 0) {
      setNeedsMarquee(false);
      translateX.setValue(0);
      return;
    }
    setNeedsMarquee(true);

    const scrollDuration = (overflow / SPEED) * 1000;
    const returnDuration = (overflow / RETURN_SPEED) * 1000;

    const loop = Animated.sequence([
      Animated.delay(PAUSE_MS),
      Animated.timing(translateX, {
        toValue: overflow,
        duration: scrollDuration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(PAUSE_MS),
      Animated.timing(translateX, {
        toValue: 0,
        duration: returnDuration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animRef.current = Animated.loop(loop);
    animRef.current.start();
  }, [translateX]);

  useEffect(() => {
    return () => { animRef.current?.stop(); };
  }, []);

  useEffect(() => {
    animRef.current?.stop();
    translateX.setValue(0);
    setNeedsMarquee(false);
    setMeasured(false);
    textWidth.current = 0;
  }, [text, translateX]);

  useEffect(() => {
    if (measured) startAnimation();
  }, [measured, startAnimation]);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    containerWidth.current = e.nativeEvent.layout.width;
  };

  const onInnerLayout = (e: LayoutChangeEvent) => {
    textWidth.current = e.nativeEvent.layout.width;
    setMeasured(true);
  };

  return (
    <View style={localStyles.container} onLayout={onContainerLayout}>
      {/* Visible scrolling text */}
      <Animated.View
        style={[
          localStyles.scrollable,
          needsMarquee && { transform: [{ translateX }] },
        ]}
      >
        <Text style={[style, localStyles.noWrap]} numberOfLines={1}>
          {text}
        </Text>
      </Animated.View>

      {/* Hidden measurer: no width constraint, captures full text width */}
      <View style={localStyles.measurer} pointerEvents="none">
        <Text style={[style, localStyles.noWrap]} onLayout={onInnerLayout}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
  },
  scrollable: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  noWrap: {
    flexShrink: 0,
  },
  measurer: {
    position: 'absolute',
    opacity: 0,
    flexDirection: 'row',
    right: 0,
  },
});
