import { FontAwesome5 } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import OnboardingProgress from "./OnboardingProgress";

// Shared layout for onboarding steps: progress bar, title, scrollable
// content, an optional Skip link and the round "next" button.
export default function OnboardingStepLayout({
  step,
  title,
  subtitle,
  canProceed = true,
  loading,
  onNext,
  onSkip,
  children,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <OnboardingProgress step={step} />
        {onSkip && (
          <Pressable onPress={onSkip} disabled={loading} hitSlop={10} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next"
        style={[styles.fab, !canProceed && { opacity: 0.4 }]}
        onPress={onNext}
        disabled={!canProceed || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <FontAwesome5 name="arrow-right" size={20} color="#fff" />
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  top: {
    paddingHorizontal: 24,
    paddingTop: 70,
  },
  skip: {
    position: "absolute",
    right: 24,
    top: 84,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6c757d",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 130,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6c757d",
    marginBottom: 24,
  },
  fab: {
    position: "absolute",
    bottom: 40,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#212529",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
