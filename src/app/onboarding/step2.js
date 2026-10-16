import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert } from "react-native";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import SelectField from "../../components/SelectField";
import { useAuth } from "../../context/AuthProvider";
import { DEPARTMENT_OPTIONS, getGraduationYearOptions } from "../../lib/onboarding";

export default function OnboardingStep2() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const graduationYearOptions = useMemo(getGraduationYearOptions, []);

  const [department, setDepartment] = useState(profile?.department ?? "");
  const [graduationYear, setGraduationYear] = useState(
    profile?.grad_year ? String(profile.grad_year) : ""
  );
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      department,
      grad_year: parseInt(graduationYear, 10),
    });
    setLoading(false);
    if (error) return Alert.alert("Error", error.message || "Failed to save your selections.");
    router.push("/onboarding/step3");
  };

  return (
    <OnboardingStepLayout
      step={2}
      title="Where do we find you on campus?"
      subtitle="Shown on your profile so people know what you study."
      canProceed={Boolean(department && graduationYear)}
      loading={loading}
      onNext={handleNext}
    >
      <SelectField
        label="Your department"
        placeholder="Select department"
        value={department}
        options={DEPARTMENT_OPTIONS}
        onSelect={setDepartment}
      />
      <SelectField
        label="Your graduation year"
        placeholder="Select year"
        value={graduationYear}
        options={graduationYearOptions}
        onSelect={setGraduationYear}
      />
    </OnboardingStepLayout>
  );
}
