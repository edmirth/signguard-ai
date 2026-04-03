import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors, fontSizes } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RiskScoreRingProps {
  score: number;
  riskLevel: string;
  size?: number;
  animated?: boolean;
}

function getColor(score: number): string {
  if (score >= 80) return '#00e5a0';
  if (score >= 60) return '#ffb340';
  if (score >= 40) return '#ff8c40';
  return '#ff4d6a';
}

function formatRiskLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

export function RiskScoreRing({ score, riskLevel, size = 160, animated = true }: RiskScoreRingProps) {
  const strokeWidth = 12;
  const padding = strokeWidth / 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  const progress = useSharedValue(animated ? 0 : score);
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(score, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [score, animated, progress]);

  useAnimatedReaction(
    () => Math.round(progress.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayScore)(current);
      }
    },
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value / 100),
  }));

  const color = getColor(score);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          {/* Background track */}
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={colors.cardBorder}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated progress arc */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="-90"
            origin={`${cx}, ${cy}`}
          />
        </Svg>
        {/* Score label in center */}
        <View style={styles.center} pointerEvents="none">
          <Text style={[styles.scoreText, { color, fontSize: size * 0.28 }]}>
            {displayScore}
          </Text>
        </View>
      </View>
      {/* Risk level label below ring */}
      <Text style={[styles.riskLabel, { color }]}>{formatRiskLevel(riskLevel)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: '800',
    letterSpacing: -1,
  },
  riskLabel: {
    marginTop: 8,
    fontSize: fontSizes.md,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
