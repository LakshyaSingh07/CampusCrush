import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import Animated from "react-native-reanimated";
import ChoiceCard from "../../components/ChoiceCard";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import { useAuth } from "../../context/AuthProvider";
import { RELATIONSHIP_GOALS } from "../../lib/profileOptions";
import { enter } from "../../ui";

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
        {RELATIONSHIP_GOALS.map((option, i) => (
          <Animated.View key={option.value} entering={enter(i + 1)}>
            <ChoiceCard
              label={option.label}
              emoji={option.emoji}
              selected={goal === option.value}
              onPress={() => setGoal(option.value)}
            />
          </Animated.View>
        ))}
      </View>
    </OnboardingStepLayout>
  );
}
