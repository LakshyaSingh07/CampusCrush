import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { resizedImageUrl } from "../lib/cloudinary";
import { goalFor } from "../lib/profileOptions";
import { makeStyles, useTheme } from "../theme";
import { AppText, haptics, IconButton } from "../ui";

// Full-bleed profile card. Tap the left/right half to move between photos.
// `profile` uses the public shape returned by the discovery/match RPCs.
// `onInfoPress` shows a button that opens the full profile.
export default function ProfileCard({ profile, style, onMorePress, onInfoPress }) {
  const t = useTheme();
  const styles = useStyles();
  const goal = goalFor(profile.relationship_goal);
  const photos = profile.photos ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [profile.user_id]);

  const go = (delta) => {
    const next = Math.min(Math.max(index + delta, 0), photos.length - 1);
    if (next !== index) {
      haptics.select();
      setIndex(next);
    }
  };

  const details = [
    profile.department,
    profile.grad_year && `’${String(profile.grad_year).slice(2)}`,
    profile.height_cm && `${profile.height_cm} cm`,
  ].filter(Boolean);

  return (
    <View style={[styles.card, style]}>
      {photos[index] ? (
        <Image
          source={{ uri: resizedImageUrl(photos[index], 800) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noPhoto]}>
          <FontAwesome5 name="user" size={64} color={t.colors.textMuted} />
        </View>
      )}

      {photos.length > 1 && (
        <View style={styles.indicators}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.indicator, i === index && styles.indicatorActive]} />
          ))}
        </View>
      )}

      <View style={styles.tapZones}>
        <Pressable style={{ flex: 1 }} onPress={() => go(-1)} accessibilityLabel="Previous photo" />
        <Pressable style={{ flex: 1 }} onPress={() => go(1)} accessibilityLabel="Next photo" />
      </View>

      <LinearGradient colors={t.gradients.photoFade} style={styles.info} pointerEvents="none">
        {goal && (
          <View style={styles.goal}>
            <AppText variant="caption" color="#1E1A12">
              {goal.emoji} {goal.label}
            </AppText>
          </View>
        )}
        <AppText variant="h1" color="#FFFFFF" style={styles.name}>
          {profile.first_name}
          <AppText variant="h2" color="rgba(255,255,255,0.85)">
            {profile.age ? `  ${profile.age}` : ""}
          </AppText>
        </AppText>
        {details.length > 0 && (
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.9)" style={{ marginTop: 2 }}>
            {details.join("  ·  ")}
          </AppText>
        )}
        {profile.interests?.length > 0 && (
          <View style={styles.tags}>
            {profile.interests.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <AppText variant="caption" color="#FFFFFF">
                  {tag}
                </AppText>
              </View>
            ))}
          </View>
        )}
        {profile.bio ? (
          <AppText variant="body" color="rgba(255,255,255,0.92)" numberOfLines={2} style={{ marginTop: 10 }}>
            {profile.bio}
          </AppText>
        ) : null}
      </LinearGradient>

      {onInfoPress && (
        <IconButton
          icon="chevron-up"
          size={40}
          iconSize={16}
          background="#FFFFFF"
          color="#1E1A12"
          elevated
          onPress={onInfoPress}
          style={styles.infoButton}
          accessibilityLabel="View full profile"
        />
      )}

      {onMorePress && (
        <IconButton
          icon="ellipsis-h"
          size={36}
          iconSize={15}
          background="rgba(0,0,0,0.35)"
          color="#FFFFFF"
          onPress={onMorePress}
          style={styles.moreButton}
          accessibilityLabel="More options"
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: t.colors.surfaceAlt,
  },
  noPhoto: {
    justifyContent: "center",
    alignItems: "center",
  },
  indicators: {
    position: "absolute",
    top: 12,
    left: 14,
    right: 14,
    flexDirection: "row",
    gap: 5,
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  indicatorActive: {
    backgroundColor: "#FFFFFF",
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  info: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 90,
    paddingBottom: 24,
  },
  goal: {
    alignSelf: "flex-start",
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: 32,
    lineHeight: 38,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    paddingRight: 48,
  },
  tag: {
    borderRadius: t.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  infoButton: {
    position: "absolute",
    right: 18,
    bottom: 24,
  },
  moreButton: {
    position: "absolute",
    top: 26,
    right: 14,
  },
}));
