import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import CustomAlert from "../../components/CustomAlert";
import OnboardingProgress from "../../components/OnboardingProgress";
import { useAuth } from "../../context/AuthProvider";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { MAX_PHOTOS, MIN_PHOTOS_REQUIRED } from "../../lib/onboarding";

const initialAlertState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

export default function OnboardingStep5() {
  const { updateProfile } = useAuth();

  // Use an array of objects to store local file URI
  const [photos, setPhotos] = useState(new Array(MAX_PHOTOS).fill(null));
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(initialAlertState);

  const photoCount = photos.filter((p) => p !== null).length;
  const canProceed = photoCount >= MIN_PHOTOS_REQUIRED;

  const handleImagePick = async (index) => {
    if (loading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setAlert({
        visible: true,
        title: "Permission Denied",
        message: "We need access to your photos to continue.",
        buttons: [
          {
            text: "OK",
            style: "primary",
            onPress: () => setAlert(initialAlertState),
          },
        ],
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      const { uri, mimeType } = result.assets[0];
      setPhotos((prev) => {
        const newPhotos = [...prev];
        newPhotos[index] = { uri, mimeType };
        return newPhotos;
      });
    }
  };

  const handleRemoveImage = (index) => {
    if (loading) return;
    setPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[index] = null;
      return newPhotos;
    });
  };

  const handleNext = async () => {
    if (!canProceed || loading) return;
    setLoading(true);

    try {
      // Upload in parallel; Promise.all keeps the order of the photo slots
      const uploadedUrls = await Promise.all(
        photos.filter(Boolean).map(uploadToCloudinary)
      );

      const { error } = await updateProfile({
        profile_image_urls: uploadedUrls,
      });
      if (error) throw error;

      // Onboarding is now complete; the guard in _layout.js moves to home.
    } catch (error) {
      setAlert({
        visible: true,
        title: "Upload Failed",
        message: error.message || "Something went wrong. Please try again.",
        buttons: [
          {
            text: "OK",
            style: "primary",
            onPress: () => setAlert(initialAlertState),
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingProgress step={5} />

      <Text style={styles.title}>Time to put a face to the name</Text>
      <Text style={styles.subtitle}>
        You do you! Add at least {MIN_PHOTOS_REQUIRED} photos, whether it’s you
        with your pet, eating your fave food, or in a place you love.
      </Text>

      {/* Photo Grid */}
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <Pressable
            key={index}
            style={styles.slot}
            onPress={() => handleImagePick(index)}
          >
            {photo ? (
              <ImageBackground source={{ uri: photo.uri }} style={styles.photo}>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <FontAwesome5 name="times" size={12} color="#fff" />
                </Pressable>
              </ImageBackground>
            ) : (
              <FontAwesome5 name="plus" size={24} color="#adb5bd" />
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.infoBox}>
        <FontAwesome5 name="lightbulb" size={16} color="#495057" />
        <Text style={styles.infoText}>
          Photos bring your profile to life, giving others a better sense of who
          you are.
        </Text>
      </View>

      <Pressable
        style={[
          styles.fab,
          !canProceed && { opacity: 0.5, backgroundColor: "#adb5bd" },
        ]}
        onPress={handleNext}
        disabled={!canProceed || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <FontAwesome5 name="arrow-right" size={20} color="#fff" />
        )}
      </Pressable>

      <CustomAlert {...alert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, paddingTop: 70 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: "#6c757d", marginBottom: 32 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  slot: {
    width: "30%",
    aspectRatio: 3 / 4, // Portrait aspect ratio
    backgroundColor: "#f1f3f5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "5%",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 16,
    marginTop: "auto", // Pushes the box towards the bottom, above the FAB
    marginBottom: 130,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: "#495057",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 40,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#212529",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
