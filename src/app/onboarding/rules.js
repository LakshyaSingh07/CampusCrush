import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { HOUSE_RULES } from "../../content/legal";
import { useAuth } from "../../context/AuthProvider";
import { getNextOnboardingRoute } from "../../lib/onboarding";
import { makeStyles, useTheme } from "../../theme";
import { AppText, Button, enter, Screen } from "../../ui";

export default function HouseRulesScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const { updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const accept = async () => {
    setSaving(true);
    const { data, error } = await updateProfile({ accepted_terms_at: new Date().toISOString() });
    setSaving(false);
    if (error) return Alert.alert("Error", error.message);
    // New users continue to step 1. Existing users who only needed to accept
    // the rules are sent to the app by the guard in _layout.js.
    const next = getNextOnboardingRoute(data);
    if (next) router.replace(next);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(0)}>
          <AppText style={styles.wave}>👋</AppText>
          <AppText variant="h1">Welcome to CampusCrush</AppText>
          <AppText color="textSecondary" style={styles.subtitle}>
            Please follow these house rules so everyone has a good time.
          </AppText>
        </Animated.View>

        {HOUSE_RULES.map((rule, i) => (
          <Animated.View key={rule.title} entering={enter(i + 1)} style={styles.rule}>
            <View style={styles.iconCircle}>
              <FontAwesome5 name={rule.icon} size={17} color={t.colors.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title">{rule.title}</AppText>
              <AppText color="textSecondary" style={{ marginTop: 2 }}>
                {rule.text}
              </AppText>
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={enter(6)}>
          <AppText variant="caption" color="textSecondary" style={styles.legal}>
            By tapping &quot;I agree&quot; you confirm you&apos;re 18 or older and agree to our{" "}
            <AppText variant="caption" color="primaryPressed" style={styles.link} onPress={() => router.push("/legal/guidelines")}>
              Community Guidelines
            </AppText>{" "}
            and{" "}
            <AppText variant="caption" color="primaryPressed" style={styles.link} onPress={() => router.push("/legal/privacy")}>
              Privacy Policy
            </AppText>
            .
          </AppText>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="I agree" onPress={accept} loading={saving} haptic="success" />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: {
    padding: t.spacing.xxl,
    paddingTop: t.spacing.xxxl,
  },
  wave: {
    fontSize: 44,
    lineHeight: 54,
    marginBottom: t.spacing.sm,
  },
  subtitle: {
    marginTop: t.spacing.sm,
    marginBottom: t.spacing.xxl,
  },
  rule: {
    flexDirection: "row",
    gap: t.spacing.lg,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    marginBottom: t.spacing.md,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: t.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  legal: {
    marginTop: t.spacing.md,
  },
  link: {
    textDecorationLine: "underline",
  },
  footer: {
    paddingHorizontal: t.spacing.xxl,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.lg,
  },
}));
