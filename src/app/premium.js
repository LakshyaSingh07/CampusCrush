import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEntitlements } from "../context/EntitlementsProvider";
import { PAYWALL_REASONS, PLANS, PREMIUM_BENEFITS } from "../lib/premium";
import { makeStyles, useTheme } from "../theme";
import { AppText, Button, enter, IconButton, pop, PressableScale } from "../ui";

const formatDate = (iso) =>
  new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Gently bobbing crown in the hero
function Crown() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: "-8deg" }] }));
  return (
    <Animated.View entering={pop(100)}>
      <Animated.View style={style}>
        <AppText style={{ fontSize: 56, lineHeight: 68 }}>👑</AppText>
      </Animated.View>
    </Animated.View>
  );
}

export default function PremiumScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { reason } = useLocalSearchParams();
  const { is_premium, premium_until, premium_plan } = useEntitlements();
  const [selectedPlan, setSelectedPlan] = useState("month");

  const plan = PLANS.find((p) => p.id === selectedPlan);

  // TODO(payments): start the purchase with the chosen payment provider and
  // let the server record it in public.subscriptions.
  const purchase = () =>
    Alert.alert(
      "Payments coming soon",
      "Premium purchases aren't live yet. During the beta, the CampusCrush team can turn on Premium for testers."
    );

  return (
    <View style={styles.container}>
      <LinearGradient colors={t.gradients.honey} style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <IconButton
          icon="times"
          size={38}
          iconSize={16}
          background="rgba(255,255,255,0.6)"
          color="#1E1A12"
          onPress={() => router.back()}
          style={[styles.close, { top: insets.top + 12 }]}
          accessibilityLabel="Close"
        />
        <Crown />
        <Animated.View entering={enter(1)}>
          <AppText variant="h1" color="#1E1A12" style={{ textAlign: "center" }}>
            CampusCrush Premium
          </AppText>
          <AppText variant="bodyMedium" color="#4A3F2A" style={{ textAlign: "center", marginTop: 6 }}>
            {PAYWALL_REASONS[reason] ?? "Get more matches, faster"}
          </AppText>
        </Animated.View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {is_premium ? (
          <Animated.View entering={enter(0)} style={styles.activeBox}>
            <FontAwesome5 name="check-circle" size={20} color={t.colors.success} solid />
            <AppText variant="bodyStrong" color="success" style={{ flex: 1 }}>
              You&apos;re Premium{premium_plan ? ` (${PLANS.find((p) => p.id === premium_plan)?.title})` : ""} until {formatDate(premium_until)}
            </AppText>
          </Animated.View>
        ) : null}

        {PREMIUM_BENEFITS.map((benefit, i) => (
          <Animated.View key={benefit.title} entering={enter(i + 2)} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <FontAwesome5 name={benefit.icon} size={15} color={t.colors.onPrimary} solid />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title" style={{ fontSize: 16 }}>
                {benefit.title}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {benefit.text}
              </AppText>
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={enter(7)} style={styles.plans}>
          {PLANS.map((p) => {
            const active = p.id === selectedPlan;
            return (
              <PressableScale
                key={p.id}
                style={[styles.plan, active && styles.planActive]}
                onPress={() => setSelectedPlan(p.id)}
                haptic="select"
                scaleTo={0.95}
              >
                {p.highlight && (
                  <View style={styles.badge}>
                    <AppText variant="small" color="#FFFFFF" style={{ fontSize: 10 }}>
                      POPULAR
                    </AppText>
                  </View>
                )}
                <AppText variant="caption" color={active ? "text" : "textSecondary"}>
                  {p.title}
                </AppText>
                <AppText variant="h1" style={{ marginVertical: 4 }}>
                  ₹{p.price}
                </AppText>
                <AppText variant="small" color="textMuted" style={{ textAlign: "center" }}>
                  {p.note}
                </AppText>
              </PressableScale>
            );
          })}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button title={`${is_premium ? "Extend" : "Get"} ${plan.title} for ₹${plan.price}`} onPress={purchase} haptic="medium" />
        <AppText variant="small" color="textMuted" style={{ textAlign: "center", marginTop: 10 }}>
          {plan.id === "day"
            ? "One-time payment. Premium ends after 24 hours."
            : "Renews automatically. Cancel anytime in your store account settings."}
        </AppText>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.bg,
  },
  hero: {
    alignItems: "center",
    paddingBottom: t.spacing.xxl,
    paddingHorizontal: t.spacing.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  close: {
    position: "absolute",
    left: t.spacing.lg,
  },
  content: {
    padding: t.spacing.xl,
  },
  activeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    backgroundColor: t.colors.successSoft,
    borderRadius: t.radius.md,
    padding: t.spacing.lg,
    marginBottom: t.spacing.lg,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.lg,
    marginBottom: t.spacing.lg,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  plans: {
    flexDirection: "row",
    gap: t.spacing.md,
    marginTop: t.spacing.md,
  },
  plan: {
    flex: 1,
    borderWidth: 2,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    paddingVertical: t.spacing.lg,
    paddingHorizontal: t.spacing.sm,
    alignItems: "center",
  },
  planActive: {
    borderColor: t.colors.primary,
    backgroundColor: t.colors.primarySoft,
    ...t.shadow(4),
  },
  badge: {
    position: "absolute",
    top: -11,
    backgroundColor: t.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: t.radius.pill,
  },
  footer: {
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.bg,
  },
}));
