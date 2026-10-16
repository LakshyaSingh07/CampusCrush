import { FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, withSpring } from "react-native-reanimated";
import Chip from "../../components/Chip";
import { ALLOWED_EMAIL_DOMAINS, isAllowedEmail, normalizeEmail } from "../../lib/onboarding";
import { supabase } from "../../lib/supabase";
import { makeStyles, useTheme } from "../../theme";
import { AppText, Button, enter, haptics, IconButton, PressableScale, Screen, SPRING, TextField } from "../../ui";

// "login": email + password. "signup": email → 6-digit code (first time).
// "reset": email → code → choose a new password.
const COPY = {
  login: {
    title: "Welcome back",
    subtitle: "Log in with your university email and password.",
    button: "Log in",
  },
  signup: {
    title: "Can we get your email, please?",
    subtitle: "We'll send a one-time code to make sure you're a real Galgotias student.",
    button: "Send me a code",
  },
  reset: {
    title: "Forgot your password?",
    subtitle: "We'll email you a code. After that you can choose a new password.",
    button: "Send me a code",
  },
};

function ModeSwitch({ mode, onChange }) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(mode === "signup" ? width / 2 : 0, SPRING) }],
  }));

  return (
    <View style={styles.switch} onLayout={(e) => setWidth(e.nativeEvent.layout.width - 8)}>
      <Animated.View style={[styles.thumb, { width: width / 2 }, thumbStyle]} />
      {[
        ["login", "Log in"],
        ["signup", "Sign up"],
      ].map(([value, label]) => (
        <PressableScale key={value} style={styles.switchItem} onPress={() => onChange(value)} haptic="select" scaleTo={0.97}>
          <AppText variant="bodyStrong" color={mode === value ? "onPrimary" : "textSecondary"}>
            {label}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const params = useLocalSearchParams();
  const [mode, setMode] = useState(params.mode === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const copy = COPY[mode];
  const localPart = email.trim();
  // While the user hasn't typed "@" yet, offer the university domains
  const showDomainChips = localPart.length > 0 && !localPart.includes("@");

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const submit = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!isAllowedEmail(normalizedEmail)) {
      haptics.warning();
      setError("Please use your Galgotias University email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (loginError) {
          haptics.warning();
          setError(
            loginError.message === "Invalid login credentials"
              ? "Wrong email or password. New here? Sign up first. Forgot it? Reset it below."
              : loginError.message
          );
        } else {
          haptics.success();
          // AuthProvider picks up the session; the guard in _layout.js routes on
        }
        return;
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        // Resetting must never create a new account
        options: { shouldCreateUser: mode === "signup" },
      });
      if (otpError) {
        haptics.warning();
        setError(
          mode === "reset" && /signups not allowed|not found/i.test(otpError.message)
            ? "There's no account with this email yet. Sign up instead."
            : otpError.message
        );
        return;
      }
      router.push({ pathname: "/verify-otp", params: { email: normalizedEmail, mode } });
    } catch (_e) {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !!email.trim() && (mode !== "login" || password.length > 0);

  return (
    <Screen keyboard scroll contentContainerStyle={styles.container}>
      <IconButton
        icon="arrow-left"
        size={40}
        background="surfaceAlt"
        onPress={() => (mode === "reset" ? switchMode("login") : router.back())}
        accessibilityLabel="Back"
      />

      {mode !== "reset" && (
        <Animated.View entering={enter(0)} style={{ marginTop: 24 }}>
          <ModeSwitch mode={mode} onChange={switchMode} />
        </Animated.View>
      )}

      <Animated.View key={mode} entering={FadeIn.duration(250)} style={styles.header}>
        <AppText variant="h1">{copy.title}</AppText>
        <AppText color="textSecondary" style={{ marginTop: 10 }}>
          {copy.subtitle}
        </AppText>
      </Animated.View>

      <Animated.View entering={enter(1)} style={{ gap: 16 }}>
        <View>
          <TextField
            label="University email"
            placeholder="your.name@galgotiasuniversity.ac.in"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType={mode === "login" ? "next" : "send"}
            onSubmitEditing={mode === "login" ? undefined : submit}
            error={mode === "login" ? null : error}
          />
          {showDomainChips && (
            <View style={styles.chips}>
              {ALLOWED_EMAIL_DOMAINS.map((domain) => (
                <Chip key={domain} label={`@${domain}`} onPress={() => setEmail(`${localPart}@${domain}`)} />
              ))}
            </View>
          )}
        </View>

        {mode === "login" && (
          <Animated.View entering={FadeIn}>
            <TextField
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={error}
            />
            <View style={styles.passwordRow}>
              <PressableScale onPress={() => setShowPassword((s) => !s)} style={styles.inline} haptic="select">
                <FontAwesome5 name={showPassword ? "eye-slash" : "eye"} size={13} color={t.colors.textSecondary} />
                <AppText variant="caption" color="textSecondary">
                  {showPassword ? "Hide" : "Show"}
                </AppText>
              </PressableScale>
              <PressableScale onPress={() => switchMode("reset")} haptic="light">
                <AppText variant="bodyStrong" color="primaryPressed">
                  Forgot password?
                </AppText>
              </PressableScale>
            </View>
          </Animated.View>
        )}
      </Animated.View>

      <View style={{ flex: 1, minHeight: 32 }} />

      <Button title={copy.button} onPress={submit} loading={loading} disabled={!canSubmit} haptic="medium" />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flexGrow: 1,
    padding: t.spacing.xxl,
    paddingTop: t.spacing.md,
  },
  switch: {
    flexDirection: "row",
    backgroundColor: t.colors.surfaceAlt,
    borderRadius: t.radius.pill,
    padding: 4,
  },
  thumb: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primary,
  },
  switchItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  header: {
    marginTop: t.spacing.xxl,
    marginBottom: t.spacing.xxl,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.spacing.sm,
    marginTop: t.spacing.md,
  },
  passwordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: t.spacing.md,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
}));
