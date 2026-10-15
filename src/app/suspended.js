import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text } from "react-native";
import { unregisterPushToken } from "../lib/notifications";
import { supabase } from "../lib/supabase";

export default function SuspendedScreen() {
  const router = useRouter();

  const logout = async () => {
    await unregisterPushToken();
    supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <FontAwesome5 name="user-slash" size={56} color="#adb5bd" />
      <Text style={styles.title}>Your account has been suspended</Text>
      <Text style={styles.text}>
        Your account was suspended for breaking our Community Guidelines, so
        your profile is hidden and you can&apos;t swipe or send messages. If
        you think this is a mistake, contact the CampusCrush team.
      </Text>
      <Pressable onPress={() => router.push("/legal/guidelines")}>
        <Text style={styles.link}>Read the Community Guidelines</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 20,
    textAlign: "center",
  },
  text: {
    fontSize: 15,
    color: "#6c757d",
    lineHeight: 22,
    marginTop: 12,
    textAlign: "center",
  },
  link: {
    color: "#7B61FF",
    fontWeight: "600",
    fontSize: 15,
    marginTop: 20,
  },
  button: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 28,
    backgroundColor: "#212529",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
