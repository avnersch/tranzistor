import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Text, TextStyle, LayoutChangeEvent } from 'react-native';

interface Props {
  text: string;
  style?: TextStyle;
}

const GAP = 48;
const SPEED = 35;
const PAUSE_MS = 1500;

export function MarqueeText({ text, style }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const textKey = useRef(text);

  const needsMarquee = textWidth > containerWidth && containerWidth > 0;

  if (text !== textKey.current) {
    textKey.current = text;
    animRef.current?.stop();
    translateX.setValue(0);
  }

  useEffect(() => {
    animRef.current?.stop();
    translateX.setValue(0);

    if (!needsMarquee) return;

    const scrollDistance = textWidth + GAP;
    const duration = (scrollDistance / SPEED) * 1000;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(PAUSE_MS),
        Animated.timing(translateX, {
          toValue: scrollDistance,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    animRef.current = anim;
    anim.start();

    return () => {
      anim.stop();
    };
  }, [needsMarquee, textWidth, containerWidth]);

  useEffect(() => {
    return () => { animRef.current?.stop(); };
  }, []);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const onTextLayout = (e: LayoutChangeEvent) => {
    setTextWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={localStyles.container} onLayout={onContainerLayout}>
      <Animated.View
        style={[
          localStyles.track,
          needsMarquee && { transform: [{ translateX }] },
        ]}
      >
        <Text style={[style, localStyles.noWrap]} numberOfLines={1}>
          {text}
        </Text>
        {needsMarquee && (
          <>
            <View style={{ width: GAP }} />
            <Text style={[style, localStyles.noWrap]} numberOfLines={1}>
              {text}
            </Text>
          </>
        )}
      </Animated.View>

      <View style={localStyles.measurer} pointerEvents="none">
        <Text style={[style, localStyles.noWrap]} onLayout={onTextLayout}>
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
  track: {
    flexDirection: 'row-reverse',
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
