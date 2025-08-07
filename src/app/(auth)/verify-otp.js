import { FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
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

  const inputs = useRef([]); // Refs for each OTP input

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

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#343a40" />
      </Pressable>

      <View style={styles.content}>
        <Image
          source={require("../../assets/otp-image.png")}
          style={styles.image}
        />
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>
          Enter the OTP sent to <Text style={styles.emailText}>{email}</Text>
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

        <Pressable style={styles.button} onPress={verifyOtp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </Pressable>
      </View>

      <CustomAlert {...alert} />
    </SafeAreaView>
  );
}

// --- NEW STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 24,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 30,
  },
  emailText: {
    fontWeight: "600",
    color: "#495057",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  otpBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: "#495057",
  },
  button: {
    backgroundColor: "#7B61FF",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
