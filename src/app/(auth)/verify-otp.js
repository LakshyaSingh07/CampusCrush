import { FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
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

const initialAlertState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState(new Array(6).fill("")); // Store OTP as an array
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(initialAlertState);

  // NEW: State for the countdown timer
  const [countdown, setCountdown] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const inputs = useRef([]); // Refs for each OTP input

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

  // NEW: useEffect to handle the countdown timer
  useEffect(() => {
    // Don't start the timer until the component is ready
    if (!isTimerActive) return;

    // If countdown reaches 0, stop the timer
    if (countdown === 0) {
      setIsTimerActive(false);
      return;
    }

    // Set up an interval to decrement the countdown every second
    const intervalId = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Clean up the interval when the component unmounts or countdown changes
    return () => clearInterval(intervalId);
  }, [countdown, isTimerActive]);

  const handleChange = (text, index) => {
    if (isNaN(text)) return; // Only allow numbers
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to next input if a digit is entered
    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }, index) => {
    // Move to previous input on backspace
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const verifyOtp = async () => {
    const token = otp.join("");
    if (token.length !== 6) {
      setAlert({
        visible: true,
        title: "Invalid Code",
        message: "Please enter all 6 digits of the code.",
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

    Keyboard.dismiss();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: "email",
      });

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
        router.replace("/(tabs)/home");
      }
    } catch (e) {
      // ... same catch block as before ...
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    // Show a small alert to confirm OTP has been resent
    setAlert({
      visible: true,
      title: "OTP Sent",
      message: "A new OTP has been sent to your email.",
      buttons: [
        {
          text: "OK",
          onPress: () => setAlert(initialAlertState),
          style: "primary",
        },
      ],
    });

    // Call Supabase to send another OTP
    await supabase.auth.signInWithOtp({ email });

    // Reset the timer
    setCountdown(60);
    setIsTimerActive(true);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#343a40" />
        </Pressable>

        <Animated.View
          style={[styles.card, { transform: [{ translateY: cardTranslateY }] }]}
        >
          <View style={styles.content}>
            <Image
              source={require("../../assets/otp-image.png")}
              style={styles.image}
            />
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>
              Enter the OTP sent to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputs.current[index] = el)}
                  style={styles.otpBox}
                  keyboardType="numeric"
                  maxLength={1}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  value={digit}
                />
              ))}
            </View>

            {/* NEW: Resend OTP UI */}
            <View style={styles.resendContainer}>
              {isTimerActive ? (
                <Text style={styles.resendText}>
                  Resend code in {countdown}s
                </Text>
              ) : (
                <Pressable onPress={resendOtp}>
                  <Text style={[styles.resendText, styles.resendButton]}>
                    Resend OTP
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Submit Button */}
            <Pressable
              style={styles.button}
              onPress={verifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>

        <CustomAlert {...alert} />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// --- NEW STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    position: "absolute",
    top: 65,
    left: 24,
    zIndex: 1,
  },
  card: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  image: {
    width: 180,
    height: 180,
    resizeMode: "contain",
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
    marginLeft: 10,
    // alignSelf: "flex-start",
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    // alignSelf: "flex-start",
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  emailText: {
    fontWeight: "600",
    color: "#343a40",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 36,
    paddingHorizontal: 10,
  },
  otpBox: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "500",
    color: "#212529",
  },
  resendContainer: {
    marginBottom: 36,
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#6c757d",
  },
  resendButton: {
    fontWeight: "bold",
    color: "#7B61FF", // Your primary theme color
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#7B61FF",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    // marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
