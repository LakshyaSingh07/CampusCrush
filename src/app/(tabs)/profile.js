import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import ProfileCard from "../../components/ProfileCard";
import { useAuth } from "../../context/AuthProvider";
import { unregisterPushToken } from "../../lib/notifications";
import { toPublicProfile } from "../../lib/profile";
import { supabase } from "../../lib/supabase";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, updateProfile } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [savingPause, setSavingPause] = useState(false);

  if (!profile) return null;

  const togglePause = async (isPaused) => {
    setSavingPause(true);
    const { error } = await updateProfile({ is_paused: isPaused });
    setSavingPause(false);
    if (error) Alert.alert("Error", error.message);
  };

  const logout = () =>
    Alert.alert("Log out?", "You can log back in with your university email.", [
      { text: "Cancel", style: "cancel" },
      // Clearing the session makes the guard in _layout.js return to welcome
      {
        text: "Log out",
        onPress: async () => {
          await unregisterPushToken();
          supabase.auth.signOut();
        },
      },
    ]);

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-user");
      if (error) {
        Alert.alert("Error", `Failed to delete account: ${error.message}`);
        return;
      }
      Alert.alert("Account deleted", "Your account and photos have been removed.");
      // The auth user no longer exists, so only clear the local session
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (_e) {}
    } catch (e) {
      Alert.alert("Error", `An unexpected error occurred: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      "Delete account?",
      "This permanently deletes your profile, photos, matches and messages. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount },
      ]
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <Text style={styles.sectionTitle}>How others see you</Text>
        <ProfileCard profile={toPublicProfile(profile)} style={styles.preview} />

        <Pressable style={styles.primaryButton} onPress={() => router.push("/edit-profile")}>
          <FontAwesome5 name="pen" size={14} color="#fff" />
          <Text style={styles.primaryText}>Edit profile</Text>
        </Pressable>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Pause my profile</Text>
            <Text style={styles.settingHint}>
              Hide from Discover. You can still chat with your matches.
            </Text>
          </View>
          {savingPause ? (
            <ActivityIndicator color="#7B61FF" />
          ) : (
            <Switch
              value={profile.is_paused}
              onValueChange={togglePause}
              trackColor={{ true: "#7B61FF" }}
            />
          )}
        </View>

        <Pressable style={styles.linkRow} onPress={() => router.push("/legal/guidelines")}>
          <FontAwesome5 name="book" size={16} color="#495057" />
          <Text style={styles.linkText}>Community Guidelines</Text>
        </Pressable>

        <Pressable style={styles.linkRow} onPress={() => router.push("/legal/privacy")}>
          <FontAwesome5 name="lock" size={16} color="#495057" />
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Pressable>

        <Pressable style={styles.linkRow} onPress={logout}>
          <FontAwesome5 name="sign-out-alt" size={16} color="#495057" />
          <Text style={styles.linkText}>Log out</Text>
        </Pressable>

        <Pressable style={styles.linkRow} onPress={confirmDelete} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color="#e03131" />
          ) : (
            <FontAwesome5 name="trash-alt" size={16} color="#e03131" />
          )}
          <Text style={[styles.linkText, styles.danger]}>Delete account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
  },
  email: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7B61FF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  preview: {
    height: 460,
  },
  primaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#7B61FF",
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 16,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
    marginTop: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dee2e6",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
  },
  settingHint: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 2,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dee2e6",
  },
  linkText: {
    fontSize: 16,
    color: "#212529",
  },
  danger: {
    color: "#e03131",
  },
});
