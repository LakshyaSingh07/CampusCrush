import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, { FadeIn, SlideInLeft, SlideInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resizedImageUrl } from "../lib/cloudinary";
import { firstMoveRole } from "../lib/matching";
import { useTheme } from "../theme";
import { AppText, Button, Confetti, enter, haptics, pop } from "../ui";

const FIRST_MOVE_TEXT = {
  me: "You have 24 hours to make the first move.",
  them: (name) => `${name} has 24 hours to make the first move.`,
  either: "Either of you can say hi. You have 24 hours.",
};

export default function MatchModal({ match, myGender, myPhoto, onMessage, onClose }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (match) haptics.success();
  }, [match]);

  if (!match) return null;
  const { profile } = match;
  const role = firstMoveRole(myGender, profile.gender);
  const firstMoveText = role === "them" ? FIRST_MOVE_TEXT.them(profile.first_name) : FIRST_MOVE_TEXT[role];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <LinearGradient colors={t.gradients.sunset} style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
        <Confetti key={match.matchId} />

        <Animated.View entering={pop(150)}>
          <AppText variant="display" color="#FFFFFF" style={styles.title}>
            It&apos;s a match!
          </AppText>
        </Animated.View>
        <Animated.View entering={enter(3)}>
          <AppText variant="title" color="#FFFFFF" style={styles.center}>
            You and {profile.first_name} like each other.
          </AppText>
        </Animated.View>

        <View style={styles.photos}>
          <Animated.View entering={SlideInLeft.springify().damping(14).delay(100)}>
            <Image source={{ uri: resizedImageUrl(myPhoto, 300) }} style={[styles.photo, { transform: [{ rotate: "-8deg" }] }]} />
          </Animated.View>
          <Animated.View entering={SlideInRight.springify().damping(14).delay(100)}>
            <Image
              source={{ uri: resizedImageUrl(profile.photos?.[0], 300) }}
              style={[styles.photo, { transform: [{ rotate: "8deg" }], marginLeft: -28 }]}
            />
          </Animated.View>
          <Animated.View entering={pop(500)} style={styles.heart}>
            <FontAwesome5 name="heart" size={22} color={t.colors.accent} solid />
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(600)} style={styles.firstMove}>
          <AppText variant="caption" color="#FFFFFF" style={styles.center}>
            {firstMoveText}
          </AppText>
        </Animated.View>

        <Animated.View entering={enter(8)} style={styles.buttons}>
          <Button
            title={role === "them" ? "Open chat" : "Send a message"}
            icon="comment-dots"
            variant="dark"
            onPress={onMessage}
            haptic="medium"
          />
          <Button title="Keep swiping" variant="ghost" onPress={onClose} style={{ marginTop: 8 }} />
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  title: {
    textAlign: "center",
    fontSize: 44,
    lineHeight: 52,
  },
  center: {
    textAlign: "center",
  },
  photos: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 40,
  },
  photo: {
    width: 140,
    height: 186,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFE8A3",
  },
  heart: {
    position: "absolute",
    alignSelf: "center",
    left: "50%",
    marginLeft: -26,
    bottom: -18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  firstMove: {
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 28,
  },
  buttons: {
    alignSelf: "stretch",
  },
});
