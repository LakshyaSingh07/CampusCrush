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
import OnboardingProgress from "../../components/OnboardingProgress";
import { useAuth } from "../../context/AuthProvider";
import { parseBirthday } from "../../lib/onboarding";

const initialAlertState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

export default function OnboardingStep1() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();

  // Prefill when the user comes back to this step
  const [savedYear, savedMonth, savedDay] = profile?.birthday?.split("-") ?? [];
  const [firstName, setFirstName] = useState(profile?.full_name ?? "");
  const [day, setDay] = useState(savedDay ?? "");
  const [month, setMonth] = useState(savedMonth ?? "");
  const [year, setYear] = useState(savedYear ?? "");

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(initialAlertState);

  const monthInput = useRef(null);
  const yearInput = useRef(null);

  const handleNext = async () => {
    // Basic validation remains the same
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

    const { birthday, error: birthdayError } = parseBirthday(day, month, year);
    if (birthdayError) {
      setAlert({
        visible: true,
        title: "Check your birthday",
        message: birthdayError,
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

    setLoading(true);

    const { error } = await updateProfile({
      full_name: firstName.trim(),
      birthday: birthday,
    });

    if (error) {
      // If the update function returns an error, show it
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
      router.push("/onboarding/step2");
    }

    setLoading(false);
  };
  const cardTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        Animated.timing(cardTranslateY, {
          toValue: -event.endCoordinates.height / 1.1, // Adjust this for how far up you want the card to move
          duration: 250,
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
  }, [cardTranslateY]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <OnboardingProgress step={1} />

        <Text style={styles.title}>Oh hey! Let’s start with an intro.</Text>

        {/* Form Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>Your first name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            maxLength={50}
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
            It’s never too early to count down
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
