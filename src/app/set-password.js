import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useAuth } from "../context/AuthProvider";
import { supabase } from "../lib/supabase";
import { makeStyles, useTheme } from "../theme";
import { AppText, Button, enter, haptics, PressableScale, Screen, TextField } from "../ui";

const MIN_PASSWORD_LENGTH = 8;

const RULES = [
  { label: `At least ${MIN_PASSWORD_LENGTH} characters`, test: (p) => p.length >= MIN_PASSWORD_LENGTH },
  { label: "A letter and a number", test: (p) => /[a-z]/i.test(p) && /\d/.test(p) },
];

// Shown after the first email-code sign-in (has_password = false) and after
// "Forgot password". The guard in _layout.js routes here.
export default function SetPasswordScreen() {
  const t = useTheme();
  const styles = useStyles();
  const { profile, updateProfile, mustSetPassword, setMustSetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const resetting = mustSetPassword && profile?.has_password;
  const valid = RULES.every((r) => r.test(password)) && password === confirm;

  const save = async () => {
    setSaving(true);
    setError(null);
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      setSaving(false);
      haptics.warning();
      setError(authError.message);
      return;
    }
    const { error: profileError } = await updateProfile({ has_password: true });
    setSaving(false);
    if (profileError) {
      setError(profileError.message);
      return;
    }
    haptics.success();
    // The guard in _layout.js moves on to onboarding or the app
    setMustSetPassword(false);
  };

  return (
    <Screen keyboard scroll contentContainerStyle={styles.content}>
      <Animated.View entering={enter(0)}>
        <View style={styles.icon}>
          <FontAwesome5 name="key" size={26} color={t.colors.onPrimary} />
        </View>
        <AppText variant="h1">{resetting ? "Choose a new password" : "Create a password"}</AppText>
        <AppText color="textSecondary" style={{ marginTop: 8, marginBottom: 28 }}>
          {resetting
            ? "Your email is verified. Set a new password to log in with from now on."
            : "Your email is verified! Next time, log in with your email and this password, no code needed."}
        </AppText>
      </Animated.View>

      <Animated.View entering={enter(1)} style={{ gap: 16 }}>
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          autoComplete="password-new"
          autoFocus
        />
        <TextField
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          error={confirm && confirm !== password ? "Passwords don't match" : error}
        />
        <PressableScale onPress={() => setShow((s) => !s)} style={styles.showRow} haptic="select">
          <FontAwesome5 name={show ? "eye-slash" : "eye"} size={14} color={t.colors.textSecondary} />
          <AppText variant="caption" color="textSecondary">
            {show ? "Hide password" : "Show password"}
          </AppText>
        </PressableScale>
      </Animated.View>

      <Animated.View entering={enter(2)} style={styles.rules}>
        {RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <View key={rule.label} style={styles.rule}>
              <FontAwesome5
                name={ok ? "check-circle" : "circle"}
                size={14}
                solid={ok}
                color={ok ? t.colors.success : t.colors.textMuted}
              />
              <AppText variant="caption" color={ok ? "success" : "textSecondary"}>
                {rule.label}
              </AppText>
            </View>
          );
        })}
      </Animated.View>

      <View style={{ flex: 1, minHeight: 24 }} />

      <Button title="Save password" onPress={save} loading={saving} disabled={!valid} haptic="medium" />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: {
    flexGrow: 1,
    padding: t.spacing.xxl,
    paddingTop: t.spacing.xxxl,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: t.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: t.spacing.xl,
  },
  showRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  rules: {
    marginTop: t.spacing.xl,
    gap: 10,
  },
  rule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
}));
