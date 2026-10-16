import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, View } from "react-native";
import Animated from "react-native-reanimated";
import ChoiceCard from "../../components/ChoiceCard";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import { useAuth } from "../../context/AuthProvider";
import { GENDER_OPTIONS, INTEREST_OPTIONS, interestLabelFor } from "../../lib/onboarding";
import { makeStyles } from "../../theme";
import { AppText, enter } from "../../ui";

const GENDER_EMOJI = { Woman: "👩", Man: "👨", Nonbinary: "🧑" };
const INTEREST_EMOJI = { Women: "👩", Men: "👨", Everyone: "🌈" };

export default function OnboardingStep3() {
  const router = useRouter();
  const styles = useStyles();
  const { profile, updateProfile } = useAuth();

  const firstName = useMemo(
    () => String(profile?.full_name ?? "").trim().split(/\s+/)[0],
    [profile?.full_name]
  );

  const [gender, setGender] = useState(profile?.gender ?? "");
  const [interest, setInterest] = useState(interestLabelFor(profile?.interested_in));
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      gender,
      interested_in: INTEREST_OPTIONS.find((opt) => opt.label === interest).value,
    });
    setLoading(false);
    if (error) return Alert.alert("Error", error.message || "Failed to save your selection.");
    router.push("/onboarding/step4");
  };

  return (
    <OnboardingStepLayout
      step={3}
      title={`${firstName || "Your name"} is a great name`}
      subtitle="We love that you’re here. Tell us a bit about who you are and who you’d like to meet."
      canProceed={Boolean(gender && interest)}
      loading={loading}
      onNext={handleNext}
    >
      <AppText variant="title" style={styles.question}>
        Which gender best describes you?
      </AppText>
      <View style={styles.group}>
        {GENDER_OPTIONS.map((opt, i) => (
          <Animated.View key={opt} entering={enter(i + 1)}>
            <ChoiceCard label={opt} emoji={GENDER_EMOJI[opt]} selected={gender === opt} onPress={() => setGender(opt)} />
          </Animated.View>
        ))}
      </View>

      <AppText variant="title" style={styles.question}>
        Show me
      </AppText>
      <View style={styles.group}>
        {INTEREST_OPTIONS.map((opt, i) => (
          <Animated.View key={opt.label} entering={enter(i + 4)}>
            <ChoiceCard
              label={opt.label}
              emoji={INTEREST_EMOJI[opt.label]}
              selected={interest === opt.label}
              onPress={() => setInterest(opt.label)}
            />
          </Animated.View>
        ))}
      </View>
    </OnboardingStepLayout>
  );
}

const useStyles = makeStyles((t) => ({
  question: {
    marginBottom: t.spacing.md,
  },
  group: {
    gap: t.spacing.md,
    marginBottom: t.spacing.xxl,
  },
}));
