import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import InterestPicker from "../../components/InterestPicker";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import { useAuth } from "../../context/AuthProvider";
import { MIN_INTERESTS } from "../../lib/profileOptions";

export default function OnboardingInterests() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [interests, setInterests] = useState(profile?.interests ?? []);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const { error } = await updateProfile({ interests });
    setLoading(false);
    if (error) return Alert.alert("Error", error.message);
    router.push("/onboarding/step8");
  };

  return (
    <OnboardingStepLayout
      step={7}
      title="What are you into?"
      subtitle={`Pick ${MIN_INTERESTS} to 5 interests. They help you find people you'll click with.`}
      canProceed={interests.length >= MIN_INTERESTS}
      loading={loading}
      onNext={handleNext}
    >
      <InterestPicker value={interests} onChange={setInterests} />
    </OnboardingStepLayout>
  );
}
