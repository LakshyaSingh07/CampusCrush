import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Modal, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resizedImageUrl } from "../lib/cloudinary";
import { goalFor, LIFESTYLE_FIELDS } from "../lib/profileOptions";
import { makeStyles, useTheme } from "../theme";
import { AppText, enter, IconButton } from "../ui";
import Chip from "./Chip";

// Full scrollable profile, Bumble-style: photos interleaved with prompts,
// interests and lifestyle. `footer` renders pinned at the bottom (e.g.
// like/pass buttons).
export default function ProfileDetails({ profile, visible, onClose, footer }) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  if (!profile) return null;

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
  const next = () => enter(section++);

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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <AppText variant="h1">
            {profile.first_name}
            {profile.age ? <AppText variant="h2" color="textSecondary">{`  ${profile.age}`}</AppText> : null}
          </AppText>
          <IconButton icon="chevron-down" size={40} background="surfaceAlt" onPress={onClose} accessibilityLabel="Close profile" />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: footer ? 140 : insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
          <Photo index={0} />

          <Animated.View entering={next()} style={styles.card}>
            {goal && (
              <View style={styles.goal}>
                <AppText variant="caption" color="onPrimary">
                  {goal.emoji} Looking for {goal.label.toLowerCase()}
                </AppText>
              </View>
            )}
            {basics.map((b) => (
              <View key={b.icon} style={styles.basicRow}>
                <FontAwesome5 name={b.icon} size={14} color={t.colors.textSecondary} />
                <AppText variant="bodyMedium">{b.text}</AppText>
              </View>
            ))}
            {profile.bio ? <AppText style={{ marginTop: 12 }}>{profile.bio}</AppText> : null}
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

        {footer ? (
          <BlurView
            intensity={60}
            tint={t.dark ? "dark" : "light"}
            style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}
          >
            {footer}
          </BlurView>
        ) : null}
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: t.spacing.xl,
    paddingVertical: t.spacing.md,
  },
  content: {
    paddingHorizontal: t.spacing.md,
    gap: t.spacing.md,
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
  goal: {
    alignSelf: "flex-start",
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    overflow: "hidden",
  },
}));
