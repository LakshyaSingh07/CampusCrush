import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthProvider";

export default function RootLayout() {
  return (
    // Wrap the entire app with the AuthProvider
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* The (auth) group will have its own layout, so we hide the header here */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        {/* The (tabs) group also has its own layout */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
