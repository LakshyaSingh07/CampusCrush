import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WheelPickerExpo from "react-native-wheel-picker-expo";
import CustomAlert from "../../components/CustomAlert";
import OnboardingProgress from "../../components/OnboardingProgress";
import { useAuth } from "../../context/AuthProvider";

const MIN_HEIGHT_CM = 150;
const MAX_HEIGHT_CM = 210;

const initialAlertState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

export default function Step4() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(initialAlertState);
  const [selectedHeight, setSelectedHeight] = useState(
    profile?.height_cm >= MIN_HEIGHT_CM && profile?.height_cm <= MAX_HEIGHT_CM
      ? profile.height_cm
      : 160
  );

  const handleNext = async () => {
    if (loading) return;
    setLoading(true);
    const { error } = await updateProfile({ height_cm: selectedHeight });
    if (error) {
      setAlert({
        visible: true,
        title: "Error",
        message: error.message,
        buttons: [
          {
            text: "OK",
            onPress: () => setAlert(initialAlertState),
            style: "primary",
          },
        ],
      });
    } else {
      router.push("/onboarding/step5");
    }
    setLoading(false);
  };

  const heightOptions = Array.from(
    { length: MAX_HEIGHT_CM - MIN_HEIGHT_CM + 1 },
    (_, i) => ({
      label: `${MIN_HEIGHT_CM + i} cm`,
      value: MIN_HEIGHT_CM + i,
    })
  );

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingProgress step={4} />

      {/* Heading */}
      <Text style={styles.title}>Now, let’s talk about you</Text>
      <Text style={styles.subtitle}>
        Let’s get the small talk out of the way. We’ll get into the deep and
        meaningful later.
      </Text>

      {/* Label */}
      <Text style={styles.label}>Your height</Text>

      {/* Wheel Picker */}
      <View style={styles.pickerContainer}>
        <WheelPickerExpo
          height={420}
          width="100%"
          marginTop={50}
          initialSelectedIndex={selectedHeight - MIN_HEIGHT_CM}
          items={heightOptions}
          onChange={({ item }) => setSelectedHeight(item.value)}
          renderItem={({ label }) => (
            <Text style={styles.pickerItem}>{label}</Text>
          )}
          style={styles.picker}
        />
        {/* Selection Indicator Box */}
        <View style={styles.selectionBox} />
      </View>

      {/* Floating Next Button */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <FontAwesome5 name="arrow-right" size={20} color="white" />
        )}
      </TouchableOpacity>

      <CustomAlert {...alert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 70,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#212529",
  },
  subtitle: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 0,
    color: "#000",
  },
  pickerContainer: {
    marginTop: 20,
    // backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 500,
    marginBottom: 20,
  },
  picker: {
    alignSelf: "center",
    marginTop: 10,
  },
  pickerItem: {
    fontSize: 22,
    textAlign: "center",
    color: "#000",
    fontWeight: "600",
  },
  selectionBox: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    transform: [{ translateY: -35 }],
    height: 70,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    pointerEvents: "none",
  },
  nextButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "black",
    width: 55,
    height: 55,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
