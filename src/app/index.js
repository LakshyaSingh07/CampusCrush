import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthProvider";
import { useTheme } from "../theme";
import { AppText, Button, enter, pop } from "../ui";

const FLOATERS = [
  { emoji: "💛", left: "10%", top: "14%", size: 34, delay: 0 },
  { emoji: "✨", left: "78%", top: "10%", size: 26, delay: 400 },
  { emoji: "☕", left: "82%", top: "36%", size: 30, delay: 800 },
  { emoji: "📚", left: "6%", top: "42%", size: 28, delay: 1200 },
  { emoji: "🎧", left: "68%", top: "54%", size: 26, delay: 600 },
];

function Floater({ emoji, left, top, size, delay }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      )
    );
  }, [y, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View entering={pop(delay / 2)} style={[styles.floater, { left, top }, style]}>
      <AppText style={{ fontSize: size, lineHeight: size * 1.25 }}>{emoji}</AppText>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { session, loading } = useAuth();

  // Redirects for signed-in users are handled by the guard in _layout.js
  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: t.colors.bg }]}>
        <ActivityIndicator size="large" color={t.colors.primaryPressed} />
      </View>
    );
  }
  // Prevents a flicker while the guard redirects
  if (session) return null;

  return (
    <LinearGradient colors={t.gradients.honey} style={styles.container}>
      {FLOATERS.map((f) => (
        <Floater key={f.emoji} {...f} />
      ))}

      <View style={[styles.hero, { paddingTop: insets.top + 80 }]}>
        <Animated.View entering={pop(100)} style={styles.logoCircle}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
        </Animated.View>
        <Animated.View entering={enter(2)}>
          <AppText variant="display" color="#1E1A12" style={styles.center}>
            CampusCrush
          </AppText>
        </Animated.View>
        <Animated.View entering={enter(3)}>
          <AppText variant="title" color="#4A3F2A" style={[styles.center, { marginTop: 8 }]}>
            Find your connection on campus.
          </AppText>
        </Animated.View>
      </View>

      <Animated.View entering={enter(5)} style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          title="Create an account"
          icon="envelope"
          variant="dark"
          onPress={() => router.push({ pathname: "/(auth)/sign-in", params: { mode: "signup" } })}
          haptic="medium"
        />
        <Button
          title="I already have an account"
          variant="secondary"
          onPress={() => router.push({ pathname: "/(auth)/sign-in", params: { mode: "login" } })}
          style={{ marginTop: 8 }}
        />
        <AppText variant="small" color="#4A3F2A" style={[styles.center, { marginTop: 16 }]}>
          Only for verified Galgotias University students, 18+
        </AppText>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    textAlign: "center",
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#3A2A00",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 64,
    height: 64,
    resizeMode: "contain",
  },
  floater: {
    position: "absolute",
  },
  bottom: {
    paddingHorizontal: 24,
  },
});
