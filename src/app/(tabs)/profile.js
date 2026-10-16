import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Switch, View } from "react-native";
import Animated from "react-native-reanimated";
import ProfileDetails from "../../components/ProfileDetails";
import { useAuth } from "../../context/AuthProvider";
import { useEntitlements } from "../../context/EntitlementsProvider";
import { resizedImageUrl } from "../../lib/cloudinary";
import { unregisterPushToken } from "../../lib/notifications";
import { toPublicProfile } from "../../lib/profile";
import { supabase } from "../../lib/supabase";
import { makeStyles, useTheme } from "../../theme";
import { AppText, Button, enter, PressableScale, Screen } from "../../ui";

// Rough "profile strength" to nudge people to fill in optional fields
const profileStrength = (p) => {
  const checks = [
    (p.profile_image_urls?.length ?? 0) >= 4,
    (p.profile_image_urls?.length ?? 0) >= 6,
    !!p.bio,
    (p.prompt_answers?.length ?? 0) >= 2,
    (p.prompt_answers?.length ?? 0) >= 3,
    (p.interests?.length ?? 0) >= 5,
    !!p.hometown,
    !!(p.drinker_status || p.smoker_status || p.exercise_status || p.religion),
  ];
  return Math.round(60 + (checks.filter(Boolean).length / checks.length) * 40);
};

function Row({ icon, label, onPress, danger, right }) {
  const t = useTheme();
  const styles = useStyles();
  return (
    <PressableScale style={styles.row} onPress={onPress} disabled={!onPress} scaleTo={0.98} haptic={onPress ? "light" : undefined}>
      <View style={[styles.rowIcon, danger && { backgroundColor: t.colors.dangerSoft }]}>
        <FontAwesome5 name={icon} size={14} color={danger ? t.colors.danger : t.colors.text} />
      </View>
      <AppText variant="bodyStrong" color={danger ? "danger" : "text"} style={{ flex: 1 }}>
        {label}
      </AppText>
      {right ?? (onPress ? <FontAwesome5 name="chevron-right" size={12} color={t.colors.textMuted} /> : null)}
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const { profile, user, updateProfile } = useAuth();
  const { is_premium, premium_until } = useEntitlements();
  const [deleting, setDeleting] = useState(false);
  const [savingPause, setSavingPause] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  if (!profile) return null;
  const publicProfile = toPublicProfile(profile);
  const strength = profileStrength(profile);

  const togglePause = async (isPaused) => {
    setSavingPause(true);
    const { error } = await updateProfile({ is_paused: isPaused });
    setSavingPause(false);
    if (error) Alert.alert("Error", error.message);
  };

  const logout = () =>
    Alert.alert("Log out?", "You can log back in with your university email.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        onPress: async () => {
          await unregisterPushToken();
          // Clearing the session makes the guard in _layout.js return to welcome
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
    <Screen edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(0)} style={styles.hero}>
          <PressableScale onPress={() => setPreviewVisible(true)} scaleTo={0.95} haptic="light">
            <LinearGradient colors={t.gradients.sunset} style={styles.avatarRing}>
              <Image source={{ uri: resizedImageUrl(profile.profile_image_urls?.[0], 300) }} style={styles.avatar} />
            </LinearGradient>
            <View style={styles.strength}>
              <AppText variant="small" color="onPrimary">
                {strength}%
              </AppText>
            </View>
          </PressableScale>
          <AppText variant="h1" style={{ marginTop: 14 }}>
            {publicProfile.first_name}
            {publicProfile.age ? <AppText variant="h2" color="textSecondary">{`, ${publicProfile.age}`}</AppText> : null}
          </AppText>
          <AppText variant="caption" color="textMuted">
            {user?.email}
          </AppText>
          <View style={styles.heroButtons}>
            <Button title="Edit profile" icon="pen" size="md" onPress={() => router.push("/edit-profile")} style={{ flex: 1 }} />
            <Button title="Preview" icon="eye" size="md" variant="secondary" onPress={() => setPreviewVisible(true)} style={{ flex: 1 }} />
          </View>
        </Animated.View>

        <Animated.View entering={enter(1)}>
          <PressableScale onPress={() => router.push("/premium")} scaleTo={0.98} haptic="light">
            <LinearGradient colors={t.gradients.honey} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumCard}>
              <View style={styles.crown}>
                <FontAwesome5 name="crown" size={20} color="#1E1A12" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title" color="#1E1A12">
                  {is_premium ? "CampusCrush Premium" : "Get Premium"}
                </AppText>
                <AppText variant="caption" color="#4A3F2A">
                  {is_premium
                    ? `Active until ${new Date(premium_until).toLocaleDateString([], { day: "numeric", month: "short" })}`
                    : "See who likes you, unlimited swipes & matches. From ₹9."}
                </AppText>
              </View>
              <FontAwesome5 name="chevron-right" size={14} color="#1E1A12" />
            </LinearGradient>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={enter(2)} style={styles.group}>
          <Row
            icon="pause"
            label="Pause my profile"
            right={
              savingPause ? (
                <ActivityIndicator color={t.colors.primaryPressed} />
              ) : (
                <Switch
                  value={profile.is_paused}
                  onValueChange={togglePause}
                  trackColor={{ true: t.colors.primary, false: t.colors.border }}
                  thumbColor="#FFFFFF"
                />
              )
            }
          />
          <AppText variant="small" color="textMuted" style={styles.groupHint}>
            Hide from Discover. You can still chat with your matches.
          </AppText>
        </Animated.View>

        <Animated.View entering={enter(3)} style={styles.group}>
          <Row icon="book" label="Community Guidelines" onPress={() => router.push("/legal/guidelines")} />
          <Row icon="lock" label="Privacy Policy" onPress={() => router.push("/legal/privacy")} />
        </Animated.View>

        <Animated.View entering={enter(4)} style={styles.group}>
          <Row icon="sign-out-alt" label="Log out" onPress={logout} />
          <Row
            icon="trash-alt"
            label="Delete account"
            danger
            onPress={deleting ? undefined : confirmDelete}
            right={deleting ? <ActivityIndicator color={t.colors.danger} /> : undefined}
          />
        </Animated.View>
      </ScrollView>

      <ProfileDetails profile={publicProfile} visible={previewVisible} onClose={() => setPreviewVisible(false)} />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: {
    padding: t.spacing.xl,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    marginBottom: t.spacing.xxl,
  },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    padding: 4,
  },
  avatar: {
    flex: 1,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: t.colors.bg,
    backgroundColor: t.colors.surfaceAlt,
  },
  strength: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 3,
    borderColor: t.colors.bg,
  },
  heroButtons: {
    flexDirection: "row",
    gap: t.spacing.md,
    marginTop: t.spacing.lg,
    alignSelf: "stretch",
  },
  premiumCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.lg,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    marginBottom: t.spacing.lg,
  },
  crown: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  group: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.sm,
    marginBottom: t.spacing.lg,
  },
  groupHint: {
    paddingHorizontal: t.spacing.md,
    paddingBottom: t.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: t.colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
}));
