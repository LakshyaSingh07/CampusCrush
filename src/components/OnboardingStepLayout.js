import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, useTheme } from "../theme";
import { AppText, enter, IconButton, PressableScale, Screen } from "../ui";
import OnboardingProgress from "./OnboardingProgress";

// Shared layout for onboarding steps: back button, animated progress, title,
// scrollable content, an optional Skip link and the round "next" button.
export default function OnboardingStepLayout({
  step,
  title,
  subtitle,
  canProceed = true,
  loading,
  onNext,
  onSkip,
  showBack = true,
  scroll = true,
  children,
}) {
  const t = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const body = (
    <>
      <Animated.View entering={enter(0)}>
        <AppText variant="h1">{title}</AppText>
        {subtitle ? (
          <AppText color="textSecondary" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </Animated.View>
      <Animated.View entering={enter(1)}>{children}</Animated.View>
    </>
  );

  return (
    <Screen keyboard>
      <View style={styles.top}>
        <View style={styles.topRow}>
          {showBack && router.canGoBack() ? (
            <IconButton icon="arrow-left" size={40} background="surfaceAlt" onPress={() => router.back()} accessibilityLabel="Back" />
          ) : (
            <View style={{ height: 40 }} />
          )}
          {onSkip && (
            <PressableScale onPress={onSkip} disabled={loading} hitSlop={10}>
              <AppText variant="bodyStrong" color="textSecondary">
                Skip
              </AppText>
            </PressableScale>
          )}
        </View>
        <OnboardingProgress step={step} />
      </View>

      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{body}</View>
      )}

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Next"
        haptic="medium"
        scaleTo={0.9}
        style={[styles.fab, { bottom: insets.bottom + 24 }, !canProceed && styles.fabDisabled]}
        onPress={onNext}
        disabled={!canProceed || loading}
      >
        {loading ? (
          <ActivityIndicator color={t.colors.onPrimary} />
        ) : (
          <FontAwesome5 name="arrow-right" size={20} color={t.colors.onPrimary} />
        )}
      </PressableScale>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  top: {
    paddingHorizontal: t.spacing.xxl,
    paddingTop: t.spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: t.spacing.lg,
  },
  subtitle: {
    marginTop: t.spacing.sm,
    marginBottom: t.spacing.xxl,
  },
  content: {
    paddingHorizontal: t.spacing.xxl,
    paddingBottom: 140,
  },
  fab: {
    position: "absolute",
    right: t.spacing.xxl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: t.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...t.shadow(6),
  },
  fabDisabled: {
    backgroundColor: t.colors.surfaceAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
}));
