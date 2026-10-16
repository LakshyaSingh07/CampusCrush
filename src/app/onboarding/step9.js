import { useState } from "react";
import { Alert } from "react-native";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import PromptEditor from "../../components/PromptEditor";
import { useAuth } from "../../context/AuthProvider";
import { AppText, haptics, TextField } from "../../ui";

const BIO_MAX = 500;

export default function OnboardingPrompts() {
  const { profile, updateProfile } = useAuth();
  const [prompts, setPrompts] = useState(profile?.prompt_answers ?? []);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      prompt_answers: prompts,
      bio: bio.trim() || null,
    });
    setLoading(false);
    if (error) return Alert.alert("Error", error.message);
    // Onboarding is complete; the guard in _layout.js opens the app
    haptics.success();
  };

  return (
    <OnboardingStepLayout
      step={9}
      title="Show off your personality"
      subtitle="Answer at least one prompt. Great answers start great conversations."
      canProceed={prompts.length >= 1}
      loading={loading}
      onNext={handleNext}
    >
      <PromptEditor value={prompts} onChange={setPrompts} />

      <AppText variant="title" style={{ marginTop: 28, marginBottom: 10 }}>
        Bio (optional)
      </AppText>
      <TextField
        placeholder="A few lines about you…"
        value={bio}
        onChangeText={setBio}
        maxLength={BIO_MAX}
        showCount
        multiline
      />
    </OnboardingStepLayout>
  );
}
