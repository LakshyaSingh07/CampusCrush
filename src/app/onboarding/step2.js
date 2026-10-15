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
import OnboardingProgress from "../../components/OnboardingProgress";
import SelectField from "../../components/SelectField";
import { useAuth } from "../../context/AuthProvider";
import {
  DEPARTMENT_OPTIONS,
  getGraduationYearOptions,
} from "../../lib/onboarding";

export default function OnboardingStep2() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();

  const departmentOptions = DEPARTMENT_OPTIONS;
  const graduationYearOptions = useMemo(getGraduationYearOptions, []);

  const [department, setDepartment] = useState(profile?.department ?? "");
  const [graduationYear, setGraduationYear] = useState(
    profile?.grad_year ? String(profile.grad_year) : ""
  );
  const [loading, setLoading] = useState(false);

  const initialAlertState = {
    visible: false,
    title: "",
    message: "",
    buttons: [],
  };
  const [alert, setAlert] = useState(initialAlertState);

  const canProceed = Boolean(department && graduationYear);

  const handleNext = async () => {
    if (!canProceed || loading) return;
    setLoading(true);
    try {
      const { error } = await updateProfile({
        department: department,
        grad_year: parseInt(graduationYear, 10),
      });

      if (error) {
        setAlert({
          visible: true,
          title: "Error",
          message: error.message || "Failed to save your selections.",
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
        router.push("/onboarding/step3");
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
      <OnboardingProgress step={2} />

      <Text style={styles.title}>Where do we find you on campus?</Text>

      <View style={{ flex: 1 }}>
        <SelectField
          label="Your department"
          placeholder="Select department"
          value={department}
          options={departmentOptions}
          onSelect={setDepartment}
        />

        <SelectField
          label="Your graduation year"
          placeholder="Select year"
          value={graduationYear}
          options={graduationYearOptions}
          onSelect={setGraduationYear}
        />
      </View>

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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 32,
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
