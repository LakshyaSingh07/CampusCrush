import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import LifestyleFields from "../../components/LifestyleFields";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import { useAuth } from "../../context/AuthProvider";

export default function OnboardingLifestyle() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [values, setValues] = useState({
    drinker_status: profile?.drinker_status ?? null,
    smoker_status: profile?.smoker_status ?? null,
    exercise_status: profile?.exercise_status ?? null,
    religion: profile?.religion ?? null,
    hometown: profile?.hometown ?? "",
  });
  const [loading, setLoading] = useState(false);

  // Every answer here is optional; Skip saves nothing but marks the step done
  const save = async (updates) => {
    setLoading(true);
    const { error } = await updateProfile({ ...updates, lifestyle_answered: true });
    setLoading(false);
    if (error) return Alert.alert("Error", error.message);
    router.push("/onboarding/step9");
  };

  return (
    <OnboardingStepLayout
      step={8}
      title="A little more about you"
      subtitle="All optional. Answer what you're comfortable sharing."
      loading={loading}
      onNext={() => save({ ...values, hometown: values.hometown.trim() || null })}
      onSkip={() => save({})}
    >
      <LifestyleFields values={values} onChange={setValues} />
    </OnboardingStepLayout>
  );
}
