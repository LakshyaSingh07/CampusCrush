import { BlurView } from "expo-blur";
import { Modal, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, useTheme } from "../theme";
import { AppText, IconButton } from "../ui";
import ProfileContent from "./ProfileContent";

// Full-screen profile sheet (Liked You, Chat, own preview). `footer` renders
// pinned at the bottom, e.g. like/pass buttons.
export default function ProfileDetails({ profile, visible, onClose, footer }) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  if (!profile) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <AppText variant="title">{profile.first_name}&apos;s profile</AppText>
          <IconButton icon="chevron-down" size={40} background="surfaceAlt" onPress={onClose} accessibilityLabel="Close profile" />
        </View>

        <View style={styles.body}>
          <ProfileContent profile={profile} bottomInset={footer ? 140 : insets.bottom + 32} />
        </View>

        {footer ? (
          <BlurView intensity={60} tint={t.dark ? "dark" : "light"} style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
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
  body: {
    flex: 1,
    paddingHorizontal: t.spacing.md,
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
