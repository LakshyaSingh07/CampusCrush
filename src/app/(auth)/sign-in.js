import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import Chip from "../../components/Chip";
import { ALLOWED_EMAIL_DOMAINS, isAllowedEmail, normalizeEmail } from "../../lib/onboarding";
import { supabase } from "../../lib/supabase";
import { makeStyles } from "../../theme";
import { AppText, Button, enter, haptics, IconButton, Screen, TextField } from "../../ui";

export default function SignInScreen() {
  const router = useRouter();
  const styles = useStyles();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // While the user hasn't typed "@" yet, offer the university domains
  const localPart = email.trim();
  const showDomainChips = localPart.length > 0 && !localPart.includes("@");

  const sendCode = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!isAllowedEmail(normalizedEmail)) {
      haptics.warning();
      setError("Please use your Galgotias University email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
      if (otpError) {
        haptics.warning();
        setError(otpError.message);
        return;
      }
      router.push({ pathname: "/verify-otp", params: { email: normalizedEmail } });
    } catch (_e) {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <View style={styles.container}>
        <IconButton icon="arrow-left" size={40} background="surfaceAlt" onPress={() => router.back()} accessibilityLabel="Back" />

        <Animated.View entering={enter(0)} style={styles.header}>
          <AppText variant="h1">Can we get your email, please?</AppText>
          <AppText color="textSecondary" style={{ marginTop: 10 }}>
            We only use it to make sure everyone on CampusCrush is a real Galgotias student.
          </AppText>
        </Animated.View>

        <Animated.View entering={enter(1)}>
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
            returnKeyType="send"
            onSubmitEditing={sendCode}
            error={error}
            autoFocus
          />

          {showDomainChips && (
            <View style={styles.chips}>
              {ALLOWED_EMAIL_DOMAINS.map((domain) => (
                <Chip key={domain} label={`@${domain}`} onPress={() => setEmail(`${localPart}@${domain}`)} />
              ))}
            </View>
          )}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={enter(2)}>
          <Button title="Send me a code" onPress={sendCode} loading={loading} disabled={!email.trim()} haptic="medium" />
        </Animated.View>
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.spacing.sm,
    marginTop: t.spacing.md,
  },
}));
