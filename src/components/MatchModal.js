import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { resizedImageUrl } from "../lib/cloudinary";
import { firstMoveRole } from "../lib/matching";

const FIRST_MOVE_TEXT = {
  me: "You have 24 hours to make the first move.",
  them: (name) => `${name} has 24 hours to make the first move.`,
  either: "Either of you can say hi. You have 24 hours.",
};

export default function MatchModal({ match, myGender, myPhoto, onMessage, onClose }) {
  if (!match) return null;
  const { profile } = match;
  const role = firstMoveRole(myGender, profile.gender);
  const firstMoveText =
    role === "them" ? FIRST_MOVE_TEXT.them(profile.first_name) : FIRST_MOVE_TEXT[role];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <LinearGradient colors={["#7B61FF", "#E64980"]} style={styles.container}>
        <Text style={styles.title}>It&apos;s a match!</Text>
        <Text style={styles.subtitle}>
          You and {profile.first_name} like each other.
        </Text>
        <Text style={styles.firstMove}>{firstMoveText}</Text>

        <View style={styles.photos}>
          <Image
            source={{ uri: resizedImageUrl(myPhoto, 300) }}
            style={[styles.photo, { transform: [{ rotate: "-8deg" }] }]}
          />
          <Image
            source={{ uri: resizedImageUrl(profile.photos?.[0], 300) }}
            style={[styles.photo, { transform: [{ rotate: "8deg" }], marginLeft: -24 }]}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={onMessage}>
          <Text style={styles.primaryText}>
            {role === "them" ? "Open chat" : "Send a message"}
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryText}>Keep swiping</Text>
        </Pressable>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 8,
    textAlign: "center",
  },
  firstMove: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    overflow: "hidden",
  },
  photos: {
    flexDirection: "row",
    marginVertical: 48,
  },
  photo: {
    width: 140,
    height: 186,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#e9ecef",
  },
  primaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  primaryText: {
    color: "#7B61FF",
    fontSize: 17,
    fontWeight: "bold",
  },
  secondaryButton: {
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  secondaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
