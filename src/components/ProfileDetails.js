import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { resizedImageUrl } from "../lib/cloudinary";
import { goalFor, LIFESTYLE_FIELDS } from "../lib/profileOptions";
import Chip from "./Chip";

// Full scrollable profile, Bumble-style: photos interleaved with prompts,
// interests and lifestyle. `footer` renders below (e.g. like/pass buttons).
export default function ProfileDetails({ profile, visible, onClose, footer }) {
  if (!profile) return null;

  const photos = profile.photos ?? [];
  const prompts = profile.prompts ?? [];
  const goal = goalFor(profile.relationship_goal);
  const lifestyle = LIFESTYLE_FIELDS.map((f) => ({ ...f, value: profile[f.cardKey] })).filter(
    (f) => f.value && f.value !== "Prefer not to say"
  );
  const basics = [
    profile.department && { icon: "graduation-cap", text: profile.department },
    profile.grad_year && { icon: "calendar", text: `Class of ${profile.grad_year}` },
    profile.height_cm && { icon: "ruler-vertical", text: `${profile.height_cm} cm` },
    profile.hometown && { icon: "home", text: profile.hometown },
  ].filter(Boolean);

  const Photo = ({ index }) =>
    photos[index] ? (
      <Image
        source={{ uri: resizedImageUrl(photos[index], 900) }}
        style={styles.photo}
        contentFit="cover"
      />
    ) : null;

  const Prompt = ({ index }) =>
    prompts[index] ? (
      <View style={styles.card}>
        <Text style={styles.promptQuestion}>{prompts[index].prompt}</Text>
        <Text style={styles.promptAnswer}>{prompts[index].answer}</Text>
      </View>
    ) : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerName}>
            {profile.first_name}
            {profile.age ? `, ${profile.age}` : ""}
          </Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close profile">
            <FontAwesome5 name="chevron-down" size={22} color="#212529" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Photo index={0} />

          <View style={styles.card}>
            {goal && (
              <View style={styles.goal}>
                <Text style={styles.goalText}>
                  {goal.emoji} Looking for {goal.label.toLowerCase()}
                </Text>
              </View>
            )}
            {basics.map((b) => (
              <View key={b.icon} style={styles.basicRow}>
                <FontAwesome5 name={b.icon} size={14} color="#6c757d" />
                <Text style={styles.basicText}>{b.text}</Text>
              </View>
            ))}
            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>

          <Prompt index={0} />
          <Photo index={1} />

          {profile.interests?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.wrap}>
                {profile.interests.map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </View>
            </View>
          )}

          <Prompt index={1} />
          <Photo index={2} />

          {lifestyle.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Lifestyle</Text>
              {lifestyle.map((f) => (
                <View key={f.key} style={styles.basicRow}>
                  <FontAwesome5 name={f.icon} size={14} color="#6c757d" />
                  <Text style={styles.basicText}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}

          <Prompt index={2} />
          {photos.slice(3).map((_, i) => (
            <Photo key={i} index={i + 3} />
          ))}
        </ScrollView>

        {footer}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  headerName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#212529",
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 40,
  },
  photo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: "#e9ecef",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  goal: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f0ff",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  goalText: {
    color: "#5f3dc4",
    fontWeight: "600",
  },
  basicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  basicText: {
    fontSize: 15,
    color: "#343a40",
  },
  bio: {
    fontSize: 16,
    lineHeight: 23,
    color: "#212529",
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7B61FF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  promptQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7B61FF",
    marginBottom: 6,
  },
  promptAnswer: {
    fontSize: 22,
    fontWeight: "600",
    color: "#212529",
    lineHeight: 30,
  },
});
