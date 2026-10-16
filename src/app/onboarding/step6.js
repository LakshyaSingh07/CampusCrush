import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import { useAuth } from "../../context/AuthProvider";
import { RELATIONSHIP_GOALS } from "../../lib/profileOptions";

export default function OnboardingGoal() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [goal, setGoal] = useState(profile?.relationship_goal ?? "");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const { error } = await updateProfile({ relationship_goal: goal });
    setLoading(false);
    if (error) return Alert.alert("Error", error.message);
    router.push("/onboarding/step7");
  };

  return (
    <OnboardingStepLayout
      step={6}
      title="What are you looking for?"
      subtitle="This is shown on your profile, so people know where you stand. You can change it anytime."
      canProceed={!!goal}
      loading={loading}
      onNext={handleNext}
    >
      <View style={{ gap: 12 }}>
        {RELATIONSHIP_GOALS.map((option) => {
          const active = goal === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setGoal(option.value)}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  optionActive: {
    borderColor: "#7B61FF",
    backgroundColor: "#f3f0ff",
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontSize: 17,
    color: "#212529",
  },
  labelActive: {
    fontWeight: "700",
    color: "#5f3dc4",
  },
});
