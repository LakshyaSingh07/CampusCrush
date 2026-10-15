import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import OnboardingProgress from "../../components/OnboardingProgress";
import { useAuth } from "../../context/AuthProvider";
import {
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  interestLabelFor,
} from "../../lib/onboarding";

const initialAlertState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

const RadioChoice = ({ label, isActive, onPress }) => (
  <Pressable
    onPress={onPress}
    style={[styles.choice, isActive && styles.choiceActive]}
  >
    <Text style={[styles.choiceText, isActive && styles.choiceTextActive]}>
      {label}
    </Text>
    <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
      {isActive ? <View style={styles.radioInner} /> : null}
    </View>
  </Pressable>
);

export default function OnboardingStep3() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();

  const firstName = useMemo(() => {
    if (!profile?.full_name) return "";
    const parts = String(profile.full_name).trim().split(/\s+/);
    return parts[0];
  }, [profile?.full_name]);

  const [gender, setGender] = useState(profile?.gender ?? "");
  const [interest, setInterest] = useState(
    interestLabelFor(profile?.interested_in)
  );
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(initialAlertState);

  const canProceed = Boolean(gender && interest);

  const handleNext = async () => {
    if (!canProceed || loading) return;
    setLoading(true);

    const interestedIn = INTEREST_OPTIONS.find(
      (opt) => opt.label === interest
    ).value;
    const { error } = await updateProfile({
      gender,
      interested_in: interestedIn,
    });

    setLoading(false);
    if (error) {
      setAlert({
        visible: true,
        title: "Error",
        message: error.message || "Failed to save your selection.",
        buttons: [
          {
            text: "OK",
            style: "primary",
            onPress: () => setAlert(initialAlertState),
          },
        ],
      });
      return;
    }

    router.push("/onboarding/step4");
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingProgress step={3} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headline}>
          {firstName || "Your name"} is a great name
        </Text>
        <Text style={styles.subtitle}>
          We love that you’re here. Tell us a bit about who you are and who
          you’d like to meet.
        </Text>

        <Text style={styles.question}>Which gender best describes you?</Text>
        <View style={styles.choiceGroup}>
          {GENDER_OPTIONS.map((opt) => (
            <RadioChoice
              key={opt}
              label={opt}
              isActive={gender === opt}
              onPress={() => setGender(opt)}
            />
          ))}
        </View>

        <Text style={styles.question}>Show me</Text>
        <View style={styles.choiceGroup}>
          {INTEREST_OPTIONS.map((opt) => (
            <RadioChoice
              key={opt.label}
              label={opt.label}
              isActive={interest === opt.label}
              onPress={() => setInterest(opt.label)}
            />
          ))}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        style={[styles.fab, !canProceed && { opacity: 0.4 }]}
        onPress={handleNext}
        disabled={!canProceed || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <FontAwesome5 name="arrow-right" size={20} color="#fff" />
        )}
      </Pressable>
      <CustomAlert {...alert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    paddingTop: 70,
  },
  scrollContent: {
    paddingBottom: 120, // Keep the last option clear of the FAB
  },
  headline: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 24,
  },
  question: {
    fontSize: 16,
    color: "#212529",
    marginBottom: 12,
    fontWeight: "600",
  },
  choiceGroup: {
    gap: 12,
    marginBottom: 28,
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  choiceActive: {
    borderColor: "#212529",
  },
  choiceText: {
    fontSize: 16,
    color: "#212529",
  },
  choiceTextActive: {
    fontWeight: "600",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#adb5bd",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: "#212529",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#212529",
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
