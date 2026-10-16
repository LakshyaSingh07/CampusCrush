import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../lib/supabase";
import { makeStyles, useTheme } from "../../theme";
import { AppText, Button, enter, haptics, IconButton, PressableScale, Screen, SPRING } from "../../ui";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

function CodeBox({ digit, active, error }) {
  const styles = useStyles();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (digit) scale.value = withSequence(withTiming(1.12, { duration: 90 }), withSpring(1, SPRING));
  }, [digit, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.box, active && styles.boxActive, digit && styles.boxFilled, error && styles.boxError, style]}>
      <AppText variant="h1">{digit ?? ""}</AppText>
    </Animated.View>
  );
}

export default function VerifyOTPScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const { email, mode } = useLocalSearchParams();
  const { setMustSetPassword } = useAuth();
  const inputRef = useRef(null);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  useEffect(() => {
    if (countdown === 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const verify = async (token) => {
    setLoading(true);
    setError(null);
    // Must be set before the session arrives so the guard opens /set-password
    if (mode === "reset") setMustSetPassword(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setLoading(false);
    if (verifyError) {
      if (mode === "reset") setMustSetPassword(false);
      haptics.warning();
      setError(verifyError.message);
      setCode("");
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      inputRef.current?.focus();
      return;
    }
    haptics.success();
    // AuthProvider picks up the new session and the guard in _layout.js
    // routes to the right onboarding step or to home.
  };

  const onChangeCode = (text) => {
    // One hidden input handles typing, pasting and SMS/email code autofill
    const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) setError(null);
    if (digits.length === CODE_LENGTH) verify(digits);
  };

  const resend = async () => {
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: mode !== "reset" },
    });
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setNotice("A new code is on its way.");
    setCountdown(RESEND_SECONDS);
  };

  return (
    <Screen keyboard>
      <View style={styles.container}>
        <IconButton icon="arrow-left" size={40} background="surfaceAlt" onPress={() => router.back()} accessibilityLabel="Back" />

        <Animated.View entering={enter(0)} style={styles.header}>
          <AppText variant="h1">Enter your code</AppText>
          <AppText color="textSecondary" style={{ marginTop: 10 }}>
            We sent a 6-digit code to{"\n"}
            <AppText variant="bodyStrong">{email}</AppText>
          </AppText>
        </Animated.View>

        <Animated.View entering={enter(1)}>
          <Pressable onPress={() => inputRef.current?.focus()}>
            <Animated.View style={[styles.boxes, shakeStyle]}>
              {Array.from({ length: CODE_LENGTH }, (_, i) => (
                <CodeBox key={i} digit={code[i]} active={i === code.length && !loading} error={!!error} />
              ))}
            </Animated.View>
          </Pressable>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={onChangeCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            autoFocus
            caretHidden
            selectionColor={t.colors.primary}
            style={styles.hiddenInput}
            accessibilityLabel="Verification code"
          />

          <AppText variant="caption" color={error ? "danger" : "success"} style={styles.message}>
            {error ?? notice ?? " "}
          </AppText>

          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <AppText variant="caption" color="textSecondary">
                Resend code in {countdown}s
              </AppText>
            ) : (
              <PressableScale onPress={resend} haptic="light">
                <AppText variant="bodyStrong" color="primaryPressed">
                  Resend code
                </AppText>
              </PressableScale>
            )}
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Button
          title="Verify"
          onPress={() => verify(code)}
          loading={loading}
          disabled={code.length !== CODE_LENGTH}
          haptic="medium"
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flex: 1,
    padding: t.spacing.xxl,
    paddingTop: t.spacing.md,
  },
  header: {
    marginTop: t.spacing.xxl,
    marginBottom: t.spacing.xxxl,
  },
  boxes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  box: {
    width: 48,
    height: 58,
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  boxActive: {
    borderColor: t.colors.primary,
    borderWidth: 2,
  },
  boxFilled: {
    backgroundColor: t.colors.primarySoft,
    borderColor: t.colors.primary,
  },
  boxError: {
    borderColor: t.colors.danger,
    backgroundColor: t.colors.dangerSoft,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  message: {
    marginTop: t.spacing.md,
    textAlign: "center",
  },
  resendRow: {
    alignItems: "center",
    marginTop: t.spacing.lg,
  },
}));
