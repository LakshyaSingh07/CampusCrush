import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { resizedImageUrl } from "../lib/cloudinary";
import { goalFor } from "../lib/profileOptions";

// Full-bleed profile card. Tap the left/right half to move between photos.
// `profile` uses the public shape returned by the discovery/match RPCs.
// `onInfoPress` shows an "i" button that opens the full profile.
export default function ProfileCard({ profile, style, onMorePress, onInfoPress }) {
  const goal = goalFor(profile.relationship_goal);
  const photos = profile.photos ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [profile.user_id]);

  const showPrev = () => setIndex((i) => Math.max(i - 1, 0));
  const showNext = () => setIndex((i) => Math.min(i + 1, photos.length - 1));

  const details = [
    profile.department,
    profile.grad_year && `Class of ${profile.grad_year}`,
    profile.height_cm && `${profile.height_cm} cm`,
  ].filter(Boolean);

  return (
    <View style={[styles.card, style]}>
      {photos[index] ? (
        <Image
          source={{ uri: resizedImageUrl(photos[index], 800) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noPhoto]}>
          <FontAwesome5 name="user" size={64} color="#adb5bd" />
        </View>
      )}

      {photos.length > 1 && (
        <View style={styles.indicators}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[styles.indicator, i === index && styles.indicatorActive]}
            />
          ))}
        </View>
      )}

      <View style={styles.tapZones}>
        <Pressable style={styles.tapZone} onPress={showPrev} />
        <Pressable style={styles.tapZone} onPress={showNext} />
      </View>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={styles.info}
        pointerEvents="none"
      >
        {goal && (
          <View style={styles.goal}>
            <Text style={styles.goalText}>
              {goal.emoji} {goal.label}
            </Text>
          </View>
        )}
        <Text style={styles.name}>
          {profile.first_name}
          {profile.age ? `, ${profile.age}` : ""}
        </Text>
        {details.length > 0 && (
          <Text style={styles.details}>{details.join(" · ")}</Text>
        )}
        {profile.interests?.length > 0 && (
          <View style={styles.tags}>
            {profile.interests.slice(0, 3).map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        )}
        {profile.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </Text>
        ) : null}
      </LinearGradient>

      {onInfoPress && (
        <Pressable
          style={styles.infoButton}
          onPress={onInfoPress}
          hitSlop={10}
          accessibilityLabel="View full profile"
        >
          <FontAwesome5 name="chevron-up" size={16} color="#212529" />
        </Pressable>
      )}

      {onMorePress && (
        <Pressable
          style={styles.moreButton}
          onPress={onMorePress}
          hitSlop={10}
          accessibilityLabel="More options"
        >
          <FontAwesome5 name="ellipsis-h" size={16} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#e9ecef",
  },
  noPhoto: {
    justifyContent: "center",
    alignItems: "center",
  },
  indicators: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  indicatorActive: {
    backgroundColor: "#fff",
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  tapZone: {
    flex: 1,
  },
  info: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  name: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  details: {
    color: "#f1f3f5",
    fontSize: 15,
    marginTop: 4,
  },
  bio: {
    color: "#f8f9fa",
    fontSize: 15,
    marginTop: 10,
    lineHeight: 21,
  },
  goal: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  goalText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5f3dc4",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tag: {
    color: "#fff",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  infoButton: {
    position: "absolute",
    right: 16,
    bottom: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  moreButton: {
    position: "absolute",
    top: 24,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
});
