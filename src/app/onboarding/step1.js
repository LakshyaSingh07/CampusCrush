import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../lib/supabase";

const initialAlertState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

export default function OnboardingStep1() {
  const router = useRouter();
  const { user } = useAuth(); // We'll need to update AuthProvider for this

  const [firstName, setFirstName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(initialAlertState);

  const monthInput = useRef(null);
  const yearInput = useRef(null);

  const handleNext = async () => {
    // Basic validation
    if (!firstName.trim() || !day || !month || !year) {
      setAlert({
        visible: true,
        title: "Incomplete Info",
        message: "Please fill in all the fields.",
        buttons: [
          {
            text: "OK",
            onPress: () => setAlert(initialAlertState),
            style: "primary",
          },
        ],
      });
      return;
    }

    const birthday = `${year}-${month}-${day}`;
    // Add more robust date validation here if needed

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: firstName, birthday: birthday })
        .eq("user_id", user.id);

      // NEW: log for the error object
      console.log("Supabase Update Error:", error);

      if (error) {
        setAlert({
          ...initialAlertState,
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
        // Navigate to the next onboarding step
        // For now, we'll just log it. Later, we'll go to step2.
        console.log("Profile updated! Ready for step 2.");
        // router.push('/onboarding/step2');
      }
    } catch (e) {
      // ... catch block
    } finally {
      setLoading(false);
    }
  };
  const cardTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        Animated.timing(cardTranslateY, {
          toValue: -event.endCoordinates.height / 1.5, // Adjust this for how far up you want the card to move
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start();
      }
    );

    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start();
      }
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>

        <Text style={styles.title}>Oh hey! Let's start with an intro.</Text>

        {/* Form Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>Your first name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            returnKeyType="next"
          />

          <Text style={styles.label}>Your birthday</Text>
          <View style={styles.birthdayContainer}>
            <TextInput
              style={styles.birthdayInput}
              placeholder="Day"
              keyboardType="number-pad"
              maxLength={2}
              value={day}
              onChangeText={(text) => {
                setDay(text);
                if (text.length === 2) monthInput.current.focus();
              }}
              returnKeyType="next"
            />
            <TextInput
              ref={monthInput}
              style={styles.birthdayInput}
              placeholder="Month"
              keyboardType="number-pad"
              maxLength={2}
              value={month}
              onChangeText={(text) => {
                setMonth(text);
                if (text.length === 2) yearInput.current.focus();
              }}
              returnKeyType="next"
            />
            <TextInput
              ref={yearInput}
              style={styles.birthdayInput}
              placeholder="Year"
              keyboardType="number-pad"
              maxLength={4}
              value={year}
              onChangeText={setYear}
            />
          </View>
          <Text style={styles.birthdayHint}>
            It's never too early to count down
          </Text>
        </View>

        {/* Floating Action Button */}
        <Animated.View
          style={[styles.card, { transform: [{ translateY: cardTranslateY }] }]}
        >
          <Pressable style={styles.fab} onPress={handleNext} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <FontAwesome5 name="arrow-right" size={20} color="#fff" />
            )}
          </Pressable>
        </Animated.View>

        <CustomAlert {...alert} />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// --- STYLES ---
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
    backgroundColor: "#343a40",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 40,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  birthdayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  birthdayInput: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    width: "30%",
    textAlign: "center",
  },
  birthdayHint: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 8,
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
