import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ImageBackground,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../context/AuthProvider";

export default function WelcomeScreen() {
  const router = useRouter();
  // This hook gets the session and loading state from our AuthProvider
  const { session, loading } = useAuth();

  // This is the important logic part from your old file, reimplemented.
  // It runs after the component renders and whenever session or loading changes.
  useEffect(() => {
    // If we are done loading and we have a session, the user is logged in.
    if (!loading && session) {
      // Instantly redirect them to the main part of the app.
      router.replace("/(tabs)/home");
    }
  }, [session, loading]);

  // While we check for a session, show a loading screen.
  // This prevents the welcome screen from "flickering" for logged-in users.
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If we are done loading and there is NO session, show the full welcome UI.
  return (
    <ImageBackground
      source={require("../assets/background-pattern.png")}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome to CampusCrush</Text>
          <Text style={styles.subtitle}>Find your connection on campus.</Text>
        </View>

        <Pressable
          style={styles.button}
          // If a new user clicks, send them to the sign-in flow.
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
