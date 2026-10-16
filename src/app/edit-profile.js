import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import InterestPicker from "../components/InterestPicker";
import LifestyleFields from "../components/LifestyleFields";
import PhotoGrid from "../components/PhotoGrid";
import PromptEditor from "../components/PromptEditor";
import SelectField from "../components/SelectField";
import { useAuth } from "../context/AuthProvider";
import { deleteRemovedPhotos, uploadPhotos } from "../lib/cloudinary";
import {
  DEPARTMENT_OPTIONS,
  GENDER_OPTIONS,
  getGraduationYearOptions,
  INTEREST_OPTIONS,
  interestLabelFor,
  MAX_PHOTOS,
  MIN_PHOTOS_REQUIRED,
} from "../lib/onboarding";
import { MIN_INTERESTS, RELATIONSHIP_GOALS } from "../lib/profileOptions";
import { makeStyles } from "../theme";
import { AppText, enter, haptics, PressableScale, Screen, TextField } from "../ui";

const BIO_MAX = 500;
const HEIGHT_OPTIONS = Array.from({ length: 61 }, (_, i) => `${150 + i} cm`);

// Each slot holds { url } for a saved photo, { uri, mimeType } for a newly
// picked one, or null.
const toSlots = (urls = []) => Array.from({ length: MAX_PHOTOS }, (_, i) => (urls[i] ? { url: urls[i] } : null));

function Section({ title, hint, index, children }) {
  const styles = useStyles();
  return (
    <Animated.View entering={enter(index)} style={styles.section}>
      <AppText variant="label" color="textSecondary">
        {title}
      </AppText>
      {hint ? (
        <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {hint}
        </AppText>
      ) : null}
      <View style={{ marginTop: 14 }}>{children}</View>
    </Animated.View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const styles = useStyles();
  const { profile, updateProfile } = useAuth();

  const [photos, setPhotos] = useState(() => toSlots(profile?.profile_image_urls));
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [department, setDepartment] = useState(profile?.department ?? "");
  const [gradYear, setGradYear] = useState(profile?.grad_year ? String(profile.grad_year) : "");
  const [height, setHeight] = useState(profile?.height_cm ? `${profile.height_cm} cm` : "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [interest, setInterest] = useState(interestLabelFor(profile?.interested_in));
  const [goal, setGoal] = useState(RELATIONSHIP_GOALS.find((g) => g.value === profile?.relationship_goal)?.label ?? "");
  const [interestTags, setInterestTags] = useState(profile?.interests ?? []);
  const [lifestyle, setLifestyle] = useState({
    drinker_status: profile?.drinker_status ?? null,
    smoker_status: profile?.smoker_status ?? null,
    exercise_status: profile?.exercise_status ?? null,
    religion: profile?.religion ?? null,
    hometown: profile?.hometown ?? "",
  });
  const [prompts, setPrompts] = useState(profile?.prompt_answers ?? []);
  const [saving, setSaving] = useState(false);

  const gradYearOptions = useMemo(() => {
    const years = getGraduationYearOptions();
    // Keep the saved year selectable even if it's now in the past
    return gradYear && !years.includes(gradYear) ? [gradYear, ...years] : years;
  }, [gradYear]);

  const save = async () => {
    const problem =
      photos.filter(Boolean).length < MIN_PHOTOS_REQUIRED
        ? `You need at least ${MIN_PHOTOS_REQUIRED} photos.`
        : !department || !gradYear || !height || !gender || !interest || !goal
          ? "Please fill in all the details."
          : interestTags.length < MIN_INTERESTS
            ? `Pick at least ${MIN_INTERESTS} interests.`
            : prompts.length < 1
              ? "Answer at least one prompt."
              : null;
    if (problem) {
      haptics.warning();
      Alert.alert("Almost there", problem);
      return;
    }

    setSaving(true);
    try {
      // Upload only newly picked photos; keep saved URLs as they are
      const filled = photos.filter(Boolean);
      const uploaded = await uploadPhotos(filled.filter((p) => !p.url));
      let next = 0;
      const urls = filled.map((p) => p.url ?? uploaded[next++]);

      const { error } = await updateProfile({
        profile_image_urls: urls,
        bio: bio.trim() || null,
        department,
        grad_year: parseInt(gradYear, 10),
        height_cm: parseInt(height, 10),
        gender,
        interested_in: INTEREST_OPTIONS.find((o) => o.label === interest).value,
        relationship_goal: RELATIONSHIP_GOALS.find((g) => g.label === goal).value,
        interests: interestTags,
        ...lifestyle,
        hometown: lifestyle.hometown.trim() || null,
        prompt_answers: prompts,
      });
      if (error) throw error;

      const previousUrls = profile?.profile_image_urls ?? [];
      deleteRemovedPhotos(previousUrls.filter((url) => !urls.includes(url)));
      haptics.success();
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", e.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen keyboard>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} hitSlop={10} disabled={saving}>
          <AppText variant="bodyMedium" color="textSecondary">
            Cancel
          </AppText>
        </PressableScale>
        <AppText variant="title">Edit profile</AppText>
        <PressableScale onPress={save} hitSlop={10} disabled={saving} haptic="light">
          <View style={styles.saveButton}>
            <AppText variant="bodyStrong" color="onPrimary">
              {saving ? "Saving…" : "Save"}
            </AppText>
          </View>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Section index={0} title="Photos" hint={`At least ${MIN_PHOTOS_REQUIRED}. Your first photo is the one people see first.`}>
          <PhotoGrid photos={photos} onChange={setPhotos} disabled={saving} />
        </Section>

        <Section index={1} title="About me">
          <TextField
            placeholder="A few lines about you: what you study, what you're into, your go-to campus spot…"
            value={bio}
            onChangeText={setBio}
            maxLength={BIO_MAX}
            showCount
            multiline
          />
        </Section>

        <Section index={2} title="Prompts">
          <PromptEditor value={prompts} onChange={setPrompts} />
        </Section>

        <Section index={3} title="Interests">
          <InterestPicker value={interestTags} onChange={setInterestTags} />
        </Section>

        <Section index={4} title="Looking for">
          <SelectField label="What are you looking for?" placeholder="Select" value={goal} options={RELATIONSHIP_GOALS.map((g) => g.label)} onSelect={setGoal} />
          <SelectField label="Show me" placeholder="Select who you'd like to see" value={interest} options={INTEREST_OPTIONS.map((o) => o.label)} onSelect={setInterest} />
        </Section>

        <Section index={5} title="Lifestyle">
          <LifestyleFields values={lifestyle} onChange={setLifestyle} />
        </Section>

        <Section index={6} title="Details">
          <SelectField label="Department" placeholder="Select department" value={department} options={DEPARTMENT_OPTIONS} onSelect={setDepartment} />
          <SelectField label="Graduation year" placeholder="Select year" value={gradYear} options={gradYearOptions} onSelect={setGradYear} />
          <SelectField label="Height" placeholder="Select height" value={height} options={HEIGHT_OPTIONS} onSelect={setHeight} />
          <SelectField label="Gender" placeholder="Select gender" value={gender} options={GENDER_OPTIONS} onSelect={setGender} />
        </Section>

        <AppText variant="caption" color="textMuted" style={{ textAlign: "center" }}>
          Your name and birthday can&apos;t be changed here.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: t.spacing.xl,
    paddingVertical: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  saveButton: {
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  content: {
    padding: t.spacing.lg,
    paddingBottom: 60,
  },
  section: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.xl,
    padding: t.spacing.lg,
    marginBottom: t.spacing.lg,
  },
}));
