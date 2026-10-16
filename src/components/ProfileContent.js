import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView as RNScrollView, View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { resizedImageUrl } from "../lib/cloudinary";
import { goalFor, LIFESTYLE_FIELDS } from "../lib/profileOptions";
import { makeStyles, useTheme } from "../theme";
import { AppText, enter, IconButton } from "../ui";
import Chip from "./Chip";

// Scrollable Bumble-style profile: the first photo with name and age on it,
// then photos interleaved with the basics, prompts, interests and lifestyle.
// Used on Discover (inside a swipeable card) and in ProfileDetails.
// gesture: use the gesture-handler ScrollView so a parent pan can coexist.
export default function ProfileContent({ profile, onMorePress, bottomInset = 32, gesture = false, animate = true }) {
  const t = useTheme();
  const styles = useStyles();
  const ScrollView = gesture ? GHScrollView : RNScrollView;

  const photos = profile.photos ?? [];
  const prompts = profile.prompts ?? [];
  const goal = goalFor(profile.relationship_goal);
  const lifestyle = LIFESTYLE_FIELDS.map((f) => ({ ...f, value: profile[f.cardKey] })).filter(
    (f) => f.value && f.value !== "Prefer not to say"
  );
  const basics = [
    profile.department && { icon: "graduation-cap", text: profile.department },
    profile.grad_year && { icon: "calendar-alt", text: `Class of ${profile.grad_year}` },
    profile.height_cm && { icon: "ruler-vertical", text: `${profile.height_cm} cm` },
    profile.hometown && { icon: "home", text: profile.hometown },
  ].filter(Boolean);

  let section = 0;
  const next = () => (animate ? enter(section++) : undefined);

  const Photo = ({ index }) =>
    photos[index] ? (
      <Animated.View entering={next()}>
        <Image source={{ uri: resizedImageUrl(photos[index], 900) }} style={styles.photo} contentFit="cover" transition={200} />
      </Animated.View>
    ) : null;

  const Prompt = ({ index }) =>
    prompts[index] ? (
      <Animated.View entering={next()} style={styles.card}>
        <AppText variant="caption" color="primaryPressed" style={{ marginBottom: 6 }}>
          {prompts[index].prompt}
        </AppText>
        <AppText variant="h2" style={{ lineHeight: 30 }}>
          {prompts[index].answer}
        </AppText>
      </Animated.View>
    ) : null;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {/* Hero: first photo with name, age and goal on it */}
      <View style={styles.hero}>
        {photos[0] ? (
          <Image source={{ uri: resizedImageUrl(photos[0], 900) }} style={styles.heroPhoto} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.heroPhoto, styles.noPhoto]}>
            <FontAwesome5 name="user" size={64} color={t.colors.textMuted} />
          </View>
        )}
        <LinearGradient colors={t.gradients.photoFade} style={styles.heroInfo} pointerEvents="none">
          {goal && (
            <View style={styles.goal}>
              <AppText variant="caption" color="onPrimary">
                {goal.emoji} {goal.label}
              </AppText>
            </View>
          )}
          <View style={styles.nameRow}>
            <AppText variant="h1" color="#FFFFFF" style={styles.name}>
              {profile.first_name}
              <AppText variant="h2" color="rgba(255,255,255,0.85)">
                {profile.age ? `  ${profile.age}` : ""}
              </AppText>
            </AppText>
            {profile.is_verified && (
              <FontAwesome5 name="check-circle" size={22} color={t.colors.verified} solid accessibilityLabel="Verified" />
            )}
          </View>
          {profile.department ? (
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.9)">
              {profile.department}
              {profile.grad_year ? `  ·  ’${String(profile.grad_year).slice(2)}` : ""}
            </AppText>
          ) : null}
        </LinearGradient>
        {onMorePress && (
          <IconButton
            icon="ellipsis-h"
            size={36}
            iconSize={15}
            background="rgba(0,0,0,0.35)"
            color="#FFFFFF"
            onPress={onMorePress}
            style={styles.more}
            accessibilityLabel="More options"
          />
        )}
      </View>

      <Animated.View entering={next()} style={styles.card}>
        {basics.map((b) => (
          <View key={b.icon} style={styles.basicRow}>
            <FontAwesome5 name={b.icon} size={14} color={t.colors.textSecondary} />
            <AppText variant="bodyMedium">{b.text}</AppText>
          </View>
        ))}
        {profile.bio ? <AppText style={{ marginTop: basics.length ? 12 : 0 }}>{profile.bio}</AppText> : null}
      </Animated.View>

      <Prompt index={0} />
      <Photo index={1} />

      {profile.interests?.length > 0 && (
        <Animated.View entering={next()} style={styles.card}>
          <AppText variant="label" color="textSecondary" style={{ marginBottom: 12 }}>
            Interests
          </AppText>
          <View style={styles.wrap}>
            {profile.interests.map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </View>
        </Animated.View>
      )}

      <Prompt index={1} />
      <Photo index={2} />

      {lifestyle.length > 0 && (
        <Animated.View entering={next()} style={styles.card}>
          <AppText variant="label" color="textSecondary" style={{ marginBottom: 8 }}>
            Lifestyle
          </AppText>
          {lifestyle.map((f) => (
            <View key={f.key} style={styles.basicRow}>
              <FontAwesome5 name={f.icon} size={14} color={t.colors.textSecondary} />
              <AppText variant="bodyMedium">{f.value}</AppText>
            </View>
          ))}
        </Animated.View>
      )}

      <Prompt index={2} />
      {photos.slice(3).map((_, i) => (
        <Photo key={i} index={i + 3} />
      ))}
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  content: {
    gap: t.spacing.md,
  },
  hero: {
    borderRadius: t.radius.xl,
    overflow: "hidden",
    backgroundColor: t.colors.surfaceAlt,
  },
  heroPhoto: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  noPhoto: {
    justifyContent: "center",
    alignItems: "center",
  },
  heroInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  goal: {
    alignSelf: "flex-start",
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 32,
    lineHeight: 38,
  },
  more: {
    position: "absolute",
    top: 14,
    right: 14,
  },
  photo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: t.radius.xl,
    backgroundColor: t.colors.surfaceAlt,
  },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.xl,
    padding: t.spacing.xl,
  },
  basicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 5,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
}));
