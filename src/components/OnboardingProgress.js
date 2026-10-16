import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ONBOARDING_STEPS } from "../lib/onboarding";
import { makeStyles } from "../theme";
import { SOFT_SPRING } from "../ui";

// Continuous bar that springs forward from the previous step
export default function OnboardingProgress({ step }) {
  const styles = useStyles();
  const progress = useSharedValue(Math.max(step - 1, 0) / ONBOARDING_STEPS);

  useEffect(() => {
    progress.value = withSpring(step / ONBOARDING_STEPS, SOFT_SPRING);
  }, [progress, step]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: ONBOARDING_STEPS, now: step }}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: t.colors.surfaceAlt,
    overflow: "hidden",
    marginBottom: 28,
  },
  fill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: t.colors.primary,
  },
}));
