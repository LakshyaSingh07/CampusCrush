import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput } from "react-native";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import PromptEditor from "../../components/PromptEditor";
import { useAuth } from "../../context/AuthProvider";

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
    if (error) Alert.alert("Error", error.message);
    // On success onboarding is complete; the guard in _layout.js opens the app.
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

      <Text style={styles.label}>Bio (optional)</Text>
      <TextInput
        style={styles.bio}
        placeholder="A few lines about you…"
        placeholderTextColor="#adb5bd"
        value={bio}
        onChangeText={setBio}
        maxLength={BIO_MAX}
        multiline
      />
      <Text style={styles.counter}>
        {bio.length}/{BIO_MAX}
      </Text>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginTop: 28,
    marginBottom: 10,
  },
  bio: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: "top",
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#adb5bd",
    marginTop: 4,
  },
});
