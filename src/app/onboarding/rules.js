import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { HOUSE_RULES } from "../../content/legal";
import { useAuth } from "../../context/AuthProvider";
import { getNextOnboardingRoute } from "../../lib/onboarding";

export default function HouseRulesScreen() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const accept = async () => {
    if (saving) return;
    setSaving(true);
    const { data, error } = await updateProfile({
      accepted_terms_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    // New users continue to step 1. Existing users who only needed to accept
    // the rules are sent to the app by the guard in _layout.js.
    const next = getNextOnboardingRoute(data);
    if (next) router.replace(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome to CampusCrush</Text>
        <Text style={styles.subtitle}>
          Please follow these house rules so everyone has a good time.
        </Text>

        {HOUSE_RULES.map((rule) => (
          <View key={rule.title} style={styles.rule}>
            <View style={styles.iconCircle}>
              <FontAwesome5 name={rule.icon} size={18} color="#7B61FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
              <Text style={styles.ruleText}>{rule.text}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.legal}>
          By tapping &quot;I agree&quot; you confirm you&apos;re 18 or older and
          agree to our{" "}
          <Text style={styles.link} onPress={() => router.push("/legal/guidelines")}>
            Community Guidelines
          </Text>{" "}
          and{" "}
          <Text style={styles.link} onPress={() => router.push("/legal/privacy")}>
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>

      <Pressable style={styles.button} onPress={accept} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>I agree</Text>
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
  content: {
    padding: 24,
    paddingTop: 70,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#212529",
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 8,
    marginBottom: 28,
  },
  rule: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 22,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f3f0ff",
    justifyContent: "center",
    alignItems: "center",
  },
  ruleTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#212529",
  },
  ruleText: {
    fontSize: 15,
    color: "#495057",
    marginTop: 2,
    lineHeight: 21,
  },
  legal: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
    marginTop: 8,
  },
  link: {
    color: "#7B61FF",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#7B61FF",
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
