import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, fontSizes, spacing, radius } from '@/constants/theme';

const STEPS = [
  'Reading your contract...',
  'Analyzing clauses...',
  'Checking for red flags...',
  'Building your report...',
];

type Props = {
  progress: number;
};

export function LoadingAnalysis({ progress }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  // Derive step from progress
  useEffect(() => {
    let step = 0;
    if (progress >= 85) step = 3;
    else if (progress >= 60) step = 2;
    else if (progress >= 30) step = 1;
    else step = 0;

    if (step !== currentStep) {
      setCurrentStep(step);
      // Reset and animate in
      fadeAnim.setValue(0);
      slideAnim.setValue(12);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [progress, currentStep]);

  // Initial fade-in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const progressBarWidth = `${Math.min(progress, 100)}%` as `${number}%`;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔍</Text>
      </View>

      <Animated.View
        style={[
          styles.stepContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.stepText}>{STEPS[currentStep]}</Text>
      </Animated.View>

      <View style={styles.stepsRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.stepDot, i <= currentStep && styles.stepDotActive]}
          />
        ))}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: progressBarWidth }]} />
      </View>

      <Text style={styles.progressLabel}>{progress}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: `${colors.accent}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
  },
  stepContainer: {
    alignItems: 'center',
    minHeight: 28,
  },
  stepText: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceBorder,
  },
  stepDotActive: {
    backgroundColor: colors.accent,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
});
