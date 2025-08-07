import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams(); // Get the email passed from the previous screen
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: "email",
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        // Success! User is now logged in.
        // We replace the current screen with '/home' so the user can't go back to the OTP screen.
        router.replace("/home");
      }
    } catch (e) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to{"\n"}
        {email}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="123456"
        placeholderTextColor="#888"
        value={token}
        onChangeText={setToken}
        keyboardType="numeric"
        maxLength={6}
        autoCapitalize="none"
      />

      <Pressable style={styles.button} onPress={verifyOtp} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify OTP</Text>
        )}
      </Pressable>
    </View>
  );
}

// --- Styles (You can copy the styles from index.js or use these) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlign: "center",
    letterSpacing: 8,
  },
  button: {
    backgroundColor: "#28a745", // A green color for success
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
