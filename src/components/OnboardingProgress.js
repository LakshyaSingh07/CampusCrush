import { StyleSheet, View } from "react-native";
import { ONBOARDING_STEPS } from "../lib/onboarding";

export default function OnboardingProgress({ step }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
        <View key={i} style={[styles.step, i < step && styles.activeStep]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 32,
  },
  step: {
    flex: 1,
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
  },
  activeStep: {
    backgroundColor: "#212529",
  },
});
