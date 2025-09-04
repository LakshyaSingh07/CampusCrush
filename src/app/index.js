import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../context/AuthProvider";

export default function WelcomeScreen() {
  const router = useRouter();
  // Get session, loading, AND the new profile state
  const { session, loading, profile } = useAuth();

  useEffect(() => {
    // If the provider is still loading data, do nothing yet.
    if (loading) {
      return;
    }

    // On refresh or cold start, gate access based on onboarding progress
    if (session) {
      const hasStep1 = Boolean(profile?.full_name && profile?.birthday);
      const hasStep2 = Boolean(profile?.department && profile?.grad_year);
      const hasStep3 = Boolean(profile?.gender);
      const hasStep4 = Boolean(profile?.height_cm);

      if (!hasStep1) {
        router.replace("/onboarding/step1");
        return;
      }

      if (!hasStep2) {
        router.replace("/onboarding/step2");
        return;
      }

      if (!hasStep3) {
        router.replace("/onboarding/step3");
        return;
      }

      if (!hasStep4) {
        router.replace("/onboarding/step4");
        return;
      }

      router.replace("/(tabs)/home");
    }
    // If there is no session, the useEffect does nothing, and the welcome screen will be shown.
  }, [session, loading, profile]); // Add profile to the dependency array

  // While we check for a session, show a loading screen.
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7B61FF" />
      </View>
    );
  }

  // This prevents the flicker. If a session exists, render nothing while the
  // useEffect above handles the redirect.
  if (session) {
    return null;
  }

  // If loading is done and there is NO session, show your beautiful UI.
  return (
    <ImageBackground
      source={require("../assets/background-pattern.png")} // Check path
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <Text style={styles.title}>Welcome to CampusCrush</Text>
          <Text style={styles.subtitle}>Find your connection on campus.</Text>
        </View>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/(auth)/sign-in")}
        >
          <FontAwesome5 name="envelope" size={20} color="#fff" />
          <Text style={styles.buttonText}>Continue with email</Text>
        </Pressable>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ... (The styles from the previous message go here)
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginTop: "25%",
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7B61FF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: "90%",
    justifyContent: "center",
    marginBottom: "50%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
});
