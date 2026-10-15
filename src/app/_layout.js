import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../context/AuthProvider";
import { getNextOnboardingRoute } from "../lib/onboarding";

// Screens a signed-in user with a complete profile should never see
const PRE_APP_GROUPS = ["(auth)", "onboarding"];

// Single place that decides where a user is allowed to be:
// - signed out            → welcome screen / (auth) screens only
// - signed in, incomplete → the onboarding step they haven't finished
// - signed in, complete   → the app (tabs, chat, edit profile, ...)
function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const group = segments[0];
    const atWelcome = segments.length === 0;

    if (!session) {
      if (!atWelcome && group !== "(auth)") router.replace("/");
      return;
    }

    const nextStep = getNextOnboardingRoute(profile);

    if (nextStep) {
      // Inside onboarding the step screens navigate themselves, which keeps
      // the back button working between steps.
      if (group !== "onboarding") router.replace(nextStep);
      return;
    }

    if (atWelcome || PRE_APP_GROUPS.includes(group)) {
      router.replace("/(tabs)/home");
    }
  }, [session, profile, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[matchId]" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
