import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import { useAuth } from "../../context/AuthProvider";
import { parseBirthday } from "../../lib/onboarding";
import { getAge } from "../../lib/profile";
import { makeStyles } from "../../theme";
import { AppText, TextField } from "../../ui";

export default function OnboardingStep1() {
  const router = useRouter();
  const styles = useStyles();
  const { profile, updateProfile } = useAuth();

  // Prefill when the user comes back to this step
  const [savedYear, savedMonth, savedDay] = profile?.birthday?.split("-") ?? [];
  const [firstName, setFirstName] = useState(profile?.full_name ?? "");
  const [day, setDay] = useState(savedDay ?? "");
  const [month, setMonth] = useState(savedMonth ?? "");
  const [year, setYear] = useState(savedYear ?? "");
  const [loading, setLoading] = useState(false);

  const monthInput = useRef(null);
  const yearInput = useRef(null);

  const complete = firstName.trim() && day && month && year.length === 4;
  const parsed = complete ? parseBirthday(day, month, year) : null;

  const handleNext = async () => {
    if (parsed?.error) {
      Alert.alert("Check your birthday", parsed.error);
      return;
    }
    setLoading(true);
    const { error } = await updateProfile({
      full_name: firstName.trim(),
      birthday: parsed.birthday,
    });
    setLoading(false);
    if (error) return Alert.alert("Error", error.message);
    router.push("/onboarding/step2");
  };

  return (
    <OnboardingStepLayout
      step={1}
      title="Oh hey! Let’s start with an intro."
      subtitle="Your first name and age are shown on your profile."
      canProceed={!!complete}
      loading={loading}
      onNext={handleNext}
      showBack={false}
    >
      <TextField
        label="Your first name"
        value={firstName}
        onChangeText={setFirstName}
        maxLength={50}
        autoCapitalize="words"
        returnKeyType="next"
        placeholder="First name"
      />

      <AppText variant="caption" color="textSecondary" style={styles.label}>
        Your birthday
      </AppText>
      <View style={styles.row}>
        <TextField
          style={styles.part}
          inputStyle={styles.center}
          placeholder="DD"
          keyboardType="number-pad"
          maxLength={2}
          value={day}
          onChangeText={(text) => {
            setDay(text);
            if (text.length === 2) monthInput.current?.focus();
          }}
        />
        <TextField
          ref={monthInput}
          style={styles.part}
          inputStyle={styles.center}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          value={month}
          onChangeText={(text) => {
            setMonth(text);
            if (text.length === 2) yearInput.current?.focus();
          }}
        />
        <TextField
          ref={yearInput}
          style={[styles.part, { flex: 1.4 }]}
          inputStyle={styles.center}
          placeholder="YYYY"
          keyboardType="number-pad"
          maxLength={4}
          value={year}
          onChangeText={setYear}
        />
      </View>

      {parsed ? (
        <Animated.View entering={FadeIn} key={parsed.error ?? parsed.birthday}>
          <AppText variant="caption" color={parsed.error ? "danger" : "success"} style={styles.hint}>
            {parsed.error ?? `You're ${getAge(parsed.birthday)} 🎂 Your birthday itself stays private.`}
          </AppText>
        </Animated.View>
      ) : (
        <AppText variant="caption" color="textMuted" style={styles.hint}>
          It’s never too early to count down
        </AppText>
      )}
    </OnboardingStepLayout>
  );
}

const useStyles = makeStyles((t) => ({
  label: {
    marginTop: t.spacing.xxl,
    marginBottom: t.spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: t.spacing.md,
  },
  part: {
    flex: 1,
  },
  center: {
    textAlign: "center",
  },
  hint: {
    marginTop: t.spacing.md,
  },
}));
