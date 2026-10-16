import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, View } from "react-native";
import WheelPickerExpo from "react-native-wheel-picker-expo";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import { useAuth } from "../../context/AuthProvider";
import { makeStyles, useTheme } from "../../theme";
import { AppText, haptics } from "../../ui";

const MIN_HEIGHT_CM = 150;
const MAX_HEIGHT_CM = 210;

const toFeet = (cm) => {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
};

export default function OnboardingStep4() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedHeight, setSelectedHeight] = useState(
    profile?.height_cm >= MIN_HEIGHT_CM && profile?.height_cm <= MAX_HEIGHT_CM ? profile.height_cm : 165
  );

  const heightOptions = useMemo(
    () =>
      Array.from({ length: MAX_HEIGHT_CM - MIN_HEIGHT_CM + 1 }, (_, i) => ({
        label: `${MIN_HEIGHT_CM + i} cm`,
        value: MIN_HEIGHT_CM + i,
      })),
    []
  );

  const handleNext = async () => {
    setLoading(true);
    const { error } = await updateProfile({ height_cm: selectedHeight });
    setLoading(false);
    if (error) return Alert.alert("Error", error.message);
    router.push("/onboarding/step5");
  };

  return (
    <OnboardingStepLayout
      step={4}
      title="Now, let’s talk about you"
      subtitle="Let’s get the small talk out of the way. We’ll get into the deep and meaningful later."
      loading={loading}
      onNext={handleNext}
      scroll={false}
    >
      <View style={styles.readout}>
        <AppText variant="display">{selectedHeight} cm</AppText>
        <AppText variant="bodyMedium" color="textSecondary">
          {toFeet(selectedHeight)}
        </AppText>
      </View>

      <View style={styles.pickerWrap}>
        <WheelPickerExpo
          height={260}
          width="100%"
          backgroundColor={t.colors.bg}
          initialSelectedIndex={selectedHeight - MIN_HEIGHT_CM}
          items={heightOptions}
          onChange={({ item }) => {
            setSelectedHeight(item.value);
            haptics.select();
          }}
          renderItem={({ label }) => (
            <AppText variant="title" style={styles.pickerItem}>
              {label}
            </AppText>
          )}
        />
        <View style={styles.selectionBox} pointerEvents="none" />
      </View>
    </OnboardingStepLayout>
  );
}

const useStyles = makeStyles((t) => ({
  readout: {
    alignItems: "center",
    marginBottom: t.spacing.lg,
  },
  pickerWrap: {
    justifyContent: "center",
  },
  pickerItem: {
    textAlign: "center",
  },
  selectionBox: {
    position: "absolute",
    left: t.spacing.xl,
    right: t.spacing.xl,
    height: 52,
    borderRadius: t.radius.md,
    borderWidth: 2,
    borderColor: t.colors.primary,
    backgroundColor: "transparent",
  },
}));
