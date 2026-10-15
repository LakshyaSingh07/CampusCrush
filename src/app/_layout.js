import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthProvider";
import { getNextOnboardingRoute } from "../lib/onboarding";

// Single place that decides where a user is allowed to be:
// - signed out            → welcome screen / (auth) screens only
// - signed in, incomplete → the onboarding step they haven't finished
// - signed in, complete   → the (tabs) app
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

    if (group !== "(tabs)") router.replace("/(tabs)/home");
  }, [session, profile, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
