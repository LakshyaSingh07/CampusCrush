import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../context/AuthProvider";
import { EntitlementsProvider } from "../context/EntitlementsProvider";
import { openChat } from "../lib/navigation";
import { registerForPushNotifications } from "../lib/notifications";
import { getNextOnboardingRoute } from "../lib/onboarding";
import { useTheme } from "../theme";

// Keep the splash screen up until fonts and the session are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// Screens a signed-in user with a complete profile should never see
const PRE_APP_GROUPS = ["(auth)", "onboarding", "suspended"];

// Single place that decides where a user is allowed to be:
// - legal pages           → always allowed
// - signed out            → welcome screen / (auth) screens only
// - suspended             → the suspended screen only
// - signed in, incomplete → the onboarding step they haven't finished
// - signed in, complete   → the app (tabs, chat, edit profile, ...)
function RootNavigator({ fontsReady }) {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const t = useTheme();

  useEffect(() => {
    if (fontsReady && !loading) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, loading]);
  const notificationResponse = Notifications.useLastNotificationResponse();
  const handledNotificationId = useRef(null);

  const isReady = !loading && !!session && !!profile && !profile.banned_at;
  const onboardingDone = isReady && !getNextOnboardingRoute(profile);

  useEffect(() => {
    if (loading) return;

    const group = segments[0];
    const atWelcome = segments.length === 0;

    if (group === "legal") return;

    if (!session) {
      if (!atWelcome && group !== "(auth)") router.replace("/");
      return;
    }

    if (profile?.banned_at) {
      if (group !== "suspended") router.replace("/suspended");
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

  // Register this device for push notifications once the user is in the app
  const userId = session?.user?.id;
  useEffect(() => {
    if (onboardingDone) registerForPushNotifications();
  }, [onboardingDone, userId]);

  // Tapping a match/message notification opens that chat (also on cold start)
  useEffect(() => {
    if (!onboardingDone || !notificationResponse) return;
    const { identifier, content } = notificationResponse.notification.request;
    if (handledNotificationId.current === identifier) return;
    handledNotificationId.current = identifier;

    const data = content.data ?? {};
    if (data.match_id) {
      openChat(router, data.match_id, {
        user_id: data.other_user_id,
        first_name: data.name,
        photos: data.photo ? [data.photo] : [],
      });
    }
  }, [notificationResponse, onboardingDone, router]);

  return (
    <>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: t.colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="chat/[matchId]" />
        <Stack.Screen name="edit-profile" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="legal/[doc]" />
        <Stack.Screen name="suspended" options={{ animation: "fade" }} />
        <Stack.Screen name="premium" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <EntitlementsProvider>
          {/* If fonts fail to load the app still opens with the system font */}
          <RootNavigator fontsReady={fontsLoaded || !!fontError} />
        </EntitlementsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
