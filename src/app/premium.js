import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEntitlements } from "../context/EntitlementsProvider";
import { PAYWALL_REASONS, PLANS, PREMIUM_BENEFITS } from "../lib/premium";

const formatDate = (iso) =>
  new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function PremiumScreen() {
  const router = useRouter();
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
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#7B61FF", "#E64980"]} style={styles.hero}>
        <Pressable style={styles.close} onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
          <FontAwesome5 name="times" size={20} color="#fff" />
        </Pressable>
        <FontAwesome5 name="crown" size={36} color="#ffd43b" />
        <Text style={styles.heroTitle}>CampusCrush Premium</Text>
        <Text style={styles.heroSubtitle}>
          {PAYWALL_REASONS[reason] ?? "Get more matches, faster"}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {is_premium ? (
          <View style={styles.activeBox}>
            <FontAwesome5 name="check-circle" size={20} color="#2f9e44" solid />
            <Text style={styles.activeText}>
              You&apos;re Premium{premium_plan ? ` (${PLANS.find((p) => p.id === premium_plan)?.title})` : ""} until{" "}
              {formatDate(premium_until)}
            </Text>
          </View>
        ) : null}

        {PREMIUM_BENEFITS.map((benefit) => (
          <View key={benefit.title} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <FontAwesome5 name={benefit.icon} size={16} color="#7B61FF" solid />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          </View>
        ))}

        <View style={styles.plans}>
          {PLANS.map((p) => {
            const active = p.id === selectedPlan;
            return (
              <Pressable
                key={p.id}
                style={[styles.plan, active && styles.planActive]}
                onPress={() => setSelectedPlan(p.id)}
              >
                {p.highlight && <Text style={styles.badge}>POPULAR</Text>}
                <Text style={[styles.planTitle, active && styles.planTitleActive]}>{p.title}</Text>
                <Text style={styles.planPrice}>₹{p.price}</Text>
                <Text style={styles.planNote}>{p.note}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.buyButton} onPress={purchase}>
          <Text style={styles.buyText}>
            {is_premium ? "Extend" : "Get"} {plan.title} for ₹{plan.price}
          </Text>
        </Pressable>
        <Text style={styles.fineprint}>
          {plan.id === "day"
            ? "One-time payment. Premium ends after 24 hours."
            : "Renews automatically. Cancel anytime in your store account settings."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  hero: {
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  close: {
    position: "absolute",
    top: 54,
    left: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 6,
    textAlign: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  activeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ebfbee",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  activeText: {
    flex: 1,
    color: "#2b8a3e",
    fontWeight: "600",
  },
  benefit: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f0ff",
    justifyContent: "center",
    alignItems: "center",
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
  },
  benefitText: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 2,
  },
  plans: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  plan: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#dee2e6",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  planActive: {
    borderColor: "#7B61FF",
    backgroundColor: "#f8f6ff",
  },
  badge: {
    position: "absolute",
    top: -10,
    backgroundColor: "#E64980",
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  planTitle: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "600",
  },
  planTitleActive: {
    color: "#5f3dc4",
  },
  planPrice: {
    fontSize: 26,
    fontWeight: "800",
    color: "#212529",
    marginVertical: 4,
  },
  planNote: {
    fontSize: 11,
    color: "#868e96",
    textAlign: "center",
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#dee2e6",
  },
  buyButton: {
    backgroundColor: "#7B61FF",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  buyText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  fineprint: {
    fontSize: 12,
    color: "#868e96",
    textAlign: "center",
    marginTop: 10,
  },
});
