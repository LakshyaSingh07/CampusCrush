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
import { supabase } from "../../lib/supabase";

// The allowed email domains for your university
const ALLOWED_DOMAINS = [
  "@galgotiasuniversity.ac.in",
  "@galgotiasuniversity.edu.in",
];

// Initial state for the custom alert
const initialAlertState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState(initialAlertState);

  // Animated value for the card
  const cardTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        Animated.timing(cardTranslateY, {
          toValue: -40, // Adjust this for how far up you want the card to move
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
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
          easing: Easing.out(Easing.ease),
        }).start();
      }
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // This function will handle the sign-in logic
  const signInWithOtp = async () => {
    // 1. Start loading
    setLoading(true);

    // 2. Validate the email domain
    const isValidDomain = ALLOWED_DOMAINS.some((domain) =>
      email.endsWith(domain)
    );
    if (!isValidDomain) {
      // Show custom alert if the email is invalid
      setAlert({
        visible: true,
        title: "Invalid Email",
        message: "Please use a valid Galgotias University email address.",
        buttons: [
          {
            text: "OK",
            style: "primary",
            onPress: () => setAlert(initialAlertState),
          },
        ],
      });
      setLoading(false);
      return;
    }

    // 3. If valid, attempt to send OTP via Supabase
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      if (error) {
        // Show error from Supabase
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
        // On success, inform the user

        //   "Check your email",
        //   "An OTP has been sent to your email address."
        router.push({ pathname: "/verify-otp", params: { email: email } });

        // In the next step, we will navigate the user to the OTP entry screen here.
      }
    } catch (e) {
      setAlert({
        visible: true,
        title: "Error",
        message: "An unexpected error occurred. Please try again.",
        buttons: [
          {
            text: "OK",
            onPress: () => setAlert(initialAlertState),
            style: "primary",
          },
        ],
      });
    } finally {
      // 4. Stop loading
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        {/* Custom Alert Modal */}
        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttons={alert.buttons}
        />

        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#343a40" />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Can we get your email, please?</Text>
          <Text style={styles.subtitle}>
            We only use emails to make sure everyone on CampusCrush is real.
          </Text>
        </View>

        <Animated.View
          style={[styles.card, { transform: [{ translateY: cardTranslateY }] }]}
        >
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your.name@galgotiasuniversity.ac.in"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Pressable
            style={styles.button}
            onPress={signInWithOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  avoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backButton: {
    position: "absolute",
    top: 65,
    left: 24,
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // A very light grey background
    // padding: 24,
  },
  header: {
    marginTop: 120,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
  },
  card: {
    marginHorizontal: 24,
    marginTop: 50,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  button: {
    backgroundColor: "#7B61FF", // Using the same purple from the welcome screen
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
