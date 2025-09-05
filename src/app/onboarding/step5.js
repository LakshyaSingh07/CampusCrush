import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
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
import { useAuth } from "../../context/AuthProvider";

// IMPORTANT: Replace these with your actual Cloudinary details
const CLOUDINARY_CLOUD_NAME = "dvhqbvsyb";
const CLOUDINARY_UPLOAD_PRESET = "campus_crush_unsigned";
const MIN_PHOTOS_REQUIRED = 3;

const initialAlertState = {
  visible: false,
  title: "",
  message: "",
  buttons: [],
};

export default function OnboardingStep5() {
  const router = useRouter();
  const { updateProfile } = useAuth();

  // Use an array of objects to store local file URI
  const [photos, setPhotos] = useState(new Array(6).fill(null));
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(initialAlertState);

  const photoCount = photos.filter((p) => p !== null).length;
  const canProceed = photoCount >= MIN_PHOTOS_REQUIRED;

  const handleImagePick = async (index) => {
    // console.log("1. Tapped on photo slot, requesting permissions...");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // console.log("2. Permission status:", status);
    if (status !== "granted") {
      //   console.log("3. Permission denied. Showing an alert to the user.");
      setAlert({
        visible: true,
        title: "Permission Denied",
        message: "We need access to your photos to continue.",
      });
      return;
    }
    // console.log("4. Permission granted! Launching image picker...");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      //   console.log("5. Image selected successfully.");
      const newPhotos = [...photos];
      newPhotos[index] = { uri: result.assets[0].uri };
      setPhotos(newPhotos);
    } // else {
    //   console.log("6. Image selection canceled by the user.");
    // }
  };

  const handleRemoveImage = (index) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    setPhotos(newPhotos);
  };

  const handleNext = async () => {
    if (!canProceed) return;
    setLoading(true);

    try {
      const uploadedUrls = [];

      for (const photo of photos) {
        if (photo && photo.uri) {
          // Upload to Cloudinary
          const formData = new FormData();
          formData.append("file", {
            uri: photo.uri,
            type: `image/${photo.uri.split(".").pop()}`,
            name: `upload.${photo.uri.split(".").pop()}`,
          });
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await response.json();
          if (data.secure_url) {
            uploadedUrls.push(data.secure_url);
          } else {
            throw new Error("Image upload failed");
          }
        }
      }

      // Save URLs to Supabase
      await updateProfile({ profile_image_urls: uploadedUrls });

      router.replace("/(tabs)/home");
    } catch (error) {
      setAlert({
        visible: true,
        title: "Upload Failed",
        message: error.message,
        buttons: [{ text: "OK", onPress: () => setAlert(initialAlertState) }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar} />
      </View>

      <Text style={styles.title}>Time to put a face to the name</Text>
      <Text style={styles.subtitle}>
        You do you! Add at least {MIN_PHOTOS_REQUIRED} photos, whether it's you
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
  progressBarContainer: {
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
    marginBottom: 32,
  },
  progressBar: {
    height: "100%",
    width: "100%",
    backgroundColor: "#212529",
    borderRadius: 2,
  },
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
    height: 90,
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
