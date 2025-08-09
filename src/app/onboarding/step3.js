import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../lib/supabase";

export default function OnboardingStep3() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const firstName = useMemo(() => {
    if (!profile?.full_name) return "";
    const parts = String(profile.full_name).trim().split(/\s+/);
    return parts[0];
  }, [profile?.full_name]);

  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const initialAlertState = {
    visible: false,
    title: "",
    message: "",
    buttons: [],
  };
  const [alert, setAlert] = useState(initialAlertState);
  const options = ["Woman", "Man", "Nonbinary"];

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ gender: selected })
        .eq("user_id", user.id);
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
      } else {
        console.log("Gender updated! Ready for step 4.");

        router.replace("/onboarding/step4");
      }
    } catch (_e) {
      setAlert({
        visible: true,
        title: "Error",
        message: "Something went wrong. Please try again.",
        buttons: [
          {
            text: "OK",
            style: "primary",
            onPress: () => setAlert(initialAlertState),
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressStep, styles.activeStep]} />
        <View style={[styles.progressStep, styles.activeStep]} />
        <View style={[styles.progressStep, styles.activeStep]} />
        <View style={styles.progressStep} />
      </View>

      <Text style={styles.headline}>
        {firstName || "Your name"} is a great name
      </Text>
      <Text style={styles.subtitle}>
        We love that you’re here. Pick the gender that best describes you.
      </Text>

      <Text style={styles.question}>Which gender best describes you?</Text>

      <View style={{ gap: 12 }}>
        {options.map((opt) => {
          const isActive = selected === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => setSelected(opt)}
              style={[styles.choice, isActive && styles.choiceActive]}
            >
              <Text
                style={[styles.choiceText, isActive && styles.choiceTextActive]}
              >
                {opt}
              </Text>
              <View
                style={[styles.radioOuter, isActive && styles.radioOuterActive]}
              >
                {isActive ? <View style={styles.radioInner} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        style={[styles.fab, !selected && { opacity: 0.4 }]}
        onPress={handleNext}
        disabled={!selected}
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
  progressContainer: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 24,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
  },
  activeStep: {
    backgroundColor: "#212529",
  },
  headline: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  underline: {
    textDecorationLine: "underline",
    textDecorationColor: "#212529",
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
