import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '@/constants/theme';

interface SkeletonProps {
  width: number | string;
  height: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height },
        { opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
});
