import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../lib/supabase";

// A lightweight select field built with a modal list to avoid extra deps
const SelectField = ({ label, placeholder, value, options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.select} onPress={() => setIsOpen(true)}>
        <Text style={[styles.selectText, !value && { color: "#adb5bd" }]}>
          {value || placeholder}
        </Text>
        <FontAwesome5 name="chevron-down" size={14} color="#495057" />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>
                <Text style={styles.sheetTitle}>{label}</Text>
                <View style={styles.optionList}>
                  {options.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        onSelect(option);
                        setIsOpen(false);
                      }}
                      style={styles.option}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default function OnboardingStep2() {
  const router = useRouter();
  const { user } = useAuth();

  const departmentOptions = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Business Administration",
    "Law",
    "Pharmacy",
    "Design",
    "Other",
  ];

  const graduationYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y <= currentYear + 8; y += 1) {
      years.push(String(y));
    }
    return years;
  }, []);

  const [department, setDepartment] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
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
    if (!canProceed) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          department: department,
          grad_year: parseInt(graduationYear, 10),
        })
        .eq("user_id", user.id);

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
        console.log("Academics updated! Ready for step 3.");
        router.push("/onboarding/step3");
      }
    } catch (e) {
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
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressStep, styles.activeStep]} />
        <View style={[styles.progressStep, styles.activeStep]} />
        <View style={styles.progressStep} />
        <View style={styles.progressStep} />
      </View>

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
        disabled={!canProceed}
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
    marginBottom: 32,
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 8,
  },
  select: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: {
    fontSize: 16,
    color: "#212529",
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
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#343a40",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  optionList: {
    paddingVertical: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
    color: "#212529",
  },
});
