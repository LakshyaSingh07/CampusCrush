import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import OnboardingStepLayout from "../../components/OnboardingStepLayout";
import PhotoGrid from "../../components/PhotoGrid";
import { useAuth } from "../../context/AuthProvider";
import { uploadPhotos } from "../../lib/cloudinary";
import { MAX_PHOTOS, MIN_PHOTOS_REQUIRED } from "../../lib/onboarding";
import { makeStyles, useTheme } from "../../theme";
import { AppText } from "../../ui";

export default function OnboardingStep5() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const { profile, updateProfile } = useAuth();

  // Keep already-uploaded photos when coming back to this step
  const [photos, setPhotos] = useState(() =>
    Array.from({ length: MAX_PHOTOS }, (_, i) => {
      const url = profile?.profile_image_urls?.[i];
      return url ? { url } : null;
    })
  );
  const [loading, setLoading] = useState(false);

  const photoCount = photos.filter(Boolean).length;

  const handleNext = async () => {
    setLoading(true);
    try {
      // Upload only newly picked photos, keeping the order of the slots
      const filled = photos.filter(Boolean);
      const uploaded = await uploadPhotos(filled.filter((p) => !p.url));
      let next = 0;
      const urls = filled.map((p) => p.url ?? uploaded[next++]);

      const { error } = await updateProfile({ profile_image_urls: urls });
      if (error) throw error;
      router.push("/onboarding/step6");
    } catch (error) {
      Alert.alert("Upload failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStepLayout
      step={5}
      title="Time to put a face to the name"
      subtitle={`Add at least ${MIN_PHOTOS_REQUIRED} photos: you with your pet, eating your fave food, or in a place you love.`}
      canProceed={photoCount >= MIN_PHOTOS_REQUIRED}
      loading={loading}
      onNext={handleNext}
    >
      <PhotoGrid photos={photos} onChange={setPhotos} disabled={loading} />

      <View style={styles.tip}>
        <FontAwesome5 name="lightbulb" size={16} color={t.colors.primaryPressed} solid />
        <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
          {photoCount < MIN_PHOTOS_REQUIRED
            ? `${MIN_PHOTOS_REQUIRED - photoCount} more to go. Clear, smiling photos of just you get the most likes.`
            : "Looking good! Your first photo is the one people see first."}
        </AppText>
      </View>
    </OnboardingStepLayout>
  );
}

const useStyles = makeStyles((t) => ({
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    backgroundColor: t.colors.surfaceAlt,
    borderRadius: t.radius.md,
    padding: t.spacing.lg,
    marginTop: t.spacing.xxl,
  },
}));
