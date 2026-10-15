import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import SelectField from "../components/SelectField";
import { useAuth } from "../context/AuthProvider";
import {
  deleteRemovedPhotos,
  resizedImageUrl,
  uploadPhotos,
} from "../lib/cloudinary";
import {
  DEPARTMENT_OPTIONS,
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  MAX_PHOTOS,
  MIN_PHOTOS_REQUIRED,
  getGraduationYearOptions,
  interestLabelFor,
} from "../lib/onboarding";

const BIO_MAX = 500;
const HEIGHT_OPTIONS = Array.from({ length: 61 }, (_, i) => `${150 + i} cm`);

// Each slot holds { url } for a saved photo, { uri, mimeType } for a newly
// picked one, or null.
const toSlots = (urls = []) =>
  Array.from({ length: MAX_PHOTOS }, (_, i) => (urls[i] ? { url: urls[i] } : null));

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();

  const [photos, setPhotos] = useState(() => toSlots(profile?.profile_image_urls));
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [department, setDepartment] = useState(profile?.department ?? "");
  const [gradYear, setGradYear] = useState(
    profile?.grad_year ? String(profile.grad_year) : ""
  );
  const [height, setHeight] = useState(
    profile?.height_cm ? `${profile.height_cm} cm` : ""
  );
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [interest, setInterest] = useState(interestLabelFor(profile?.interested_in));
  const [saving, setSaving] = useState(false);

  const gradYearOptions = useMemo(() => {
    const years = getGraduationYearOptions();
    // Keep the saved year selectable even if it's now in the past
    return gradYear && !years.includes(gradYear) ? [gradYear, ...years] : years;
  }, [gradYear]);

  const photoCount = photos.filter(Boolean).length;

  const pickPhoto = async (index) => {
    if (saving) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos to add one.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (result.canceled) return;
    const { uri, mimeType } = result.assets[0];
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = { uri, mimeType };
      return next;
    });
  };

  const removePhoto = (index) => {
    if (saving) return;
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const save = async () => {
    if (photoCount < MIN_PHOTOS_REQUIRED) {
      Alert.alert("Add more photos", `You need at least ${MIN_PHOTOS_REQUIRED} photos.`);
      return;
    }
    if (!department || !gradYear || !height || !gender || !interest) {
      Alert.alert("Incomplete", "Please fill in all the fields.");
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
      });
      if (error) throw error;

      const previousUrls = profile?.profile_image_urls ?? [];
      deleteRemovedPhotos(previousUrls.filter((url) => !urls.includes(url)));
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", e.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} disabled={saving}>
          <Text style={styles.headerCancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <Pressable onPress={save} hitSlop={10} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#7B61FF" />
          ) : (
            <Text style={styles.headerSave}>Save</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.hint}>
            At least {MIN_PHOTOS_REQUIRED}. Your first photo is the one people
            see first.
          </Text>
          <View style={styles.grid}>
            {photos.map((photo, index) => (
              <Pressable key={index} style={styles.slot} onPress={() => pickPhoto(index)}>
                {photo ? (
                  <>
                    <Image
                      source={{ uri: photo.url ? resizedImageUrl(photo.url, 300) : photo.uri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removePhoto(index)}
                      hitSlop={6}
                    >
                      <FontAwesome5 name="times" size={12} color="#fff" />
                    </Pressable>
                  </>
                ) : (
                  <FontAwesome5 name="plus" size={22} color="#adb5bd" />
                )}
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>About me</Text>
          <TextInput
            style={styles.bio}
            placeholder="A few lines about you: what you study, what you're into, your go-to campus spot..."
            placeholderTextColor="#adb5bd"
            value={bio}
            onChangeText={setBio}
            maxLength={BIO_MAX}
            multiline
          />
          <Text style={styles.counter}>
            {bio.length}/{BIO_MAX}
          </Text>

          <Text style={styles.sectionTitle}>Details</Text>
          <SelectField
            label="Department"
            placeholder="Select department"
            value={department}
            options={DEPARTMENT_OPTIONS}
            onSelect={setDepartment}
          />
          <SelectField
            label="Graduation year"
            placeholder="Select year"
            value={gradYear}
            options={gradYearOptions}
            onSelect={setGradYear}
          />
          <SelectField
            label="Height"
            placeholder="Select height"
            value={height}
            options={HEIGHT_OPTIONS}
            onSelect={setHeight}
          />
          <SelectField
            label="Gender"
            placeholder="Select gender"
            value={gender}
            options={GENDER_OPTIONS}
            onSelect={setGender}
          />
          <SelectField
            label="Show me"
            placeholder="Select who you'd like to see"
            value={interest}
            options={INTEREST_OPTIONS.map((o) => o.label)}
            onSelect={setInterest}
          />

          <Text style={styles.locked}>
            Your name and birthday can&apos;t be changed here.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dee2e6",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212529",
  },
  headerCancel: {
    fontSize: 16,
    color: "#6c757d",
  },
  headerSave: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7B61FF",
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7B61FF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: "#6c757d",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  slot: {
    width: "31%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f1f3f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  removeButton: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  bio: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 14,
    minHeight: 110,
    fontSize: 16,
    textAlignVertical: "top",
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#adb5bd",
    marginTop: 4,
    marginBottom: 16,
  },
  locked: {
    fontSize: 13,
    color: "#adb5bd",
    textAlign: "center",
    marginTop: 8,
  },
});
