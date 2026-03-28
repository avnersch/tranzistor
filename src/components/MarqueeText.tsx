import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';

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
  const prevText = useRef(text);

  const needsMarquee = textWidth > containerWidth && containerWidth > 0 && textWidth > 0;

  if (text !== prevText.current) {
    prevText.current = text;
    animRef.current?.stop();
    translateX.setValue(0);
    setTextWidth(0);
  }

  useEffect(() => {
    animRef.current?.stop();
    translateX.setValue(0);

    if (!needsMarquee) return;

    const scrollDistance = textWidth + GAP;
    const duration = (scrollDistance / SPEED) * 1000;

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
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
    return () => {
      animRef.current?.stop();
    };
  }, []);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const onMeasure = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setTextWidth(w);
  };

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <Animated.View
        style={[
          styles.track,
          needsMarquee && { transform: [{ translateX }] },
        ]}
      >
        <Text
          style={[style, styles.noWrap, needsMarquee && { width: textWidth }]}
          numberOfLines={needsMarquee ? undefined : 1}
        >
          {text}
        </Text>
        {needsMarquee && (
          <>
            <View style={{ width: GAP }} />
            <Text style={[style, styles.noWrap, { width: textWidth }]}>
              {text}
            </Text>
          </>
        )}
      </Animated.View>

      <View style={styles.measurerWrapper} pointerEvents="none">
        <Text style={style} onLayout={onMeasure}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  measurerWrapper: {
    position: 'absolute',
    opacity: 0,
    width: 99999,
    alignItems: 'flex-start',
  },
});
