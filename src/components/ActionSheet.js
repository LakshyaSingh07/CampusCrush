import { FontAwesome5 } from "@expo/vector-icons";
import { Modal, Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, useTheme } from "../theme";
import { AppText, PressableScale } from "../ui";

// Bottom sheet with a list of actions. Used instead of Alert.alert because
// Android alerts can show at most three buttons.
export default function ActionSheet({ visible, title, options, onClose }) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {visible && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            exiting={SlideOutDown}
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.handle} />
            {title ? (
              <AppText variant="caption" color="textSecondary" style={styles.title}>
                {title}
              </AppText>
            ) : null}
            {options.map((option) => (
              <PressableScale
                key={option.label}
                style={styles.option}
                scaleTo={0.98}
                haptic="light"
                onPress={() => {
                  onClose();
                  // iOS drops alerts/modals presented while another modal
                  // is still animating out
                  setTimeout(option.onPress, 350);
                }}
              >
                {option.icon ? (
                  <FontAwesome5
                    name={option.icon}
                    size={16}
                    color={option.destructive ? t.colors.danger : t.colors.text}
                    style={{ width: 22 }}
                  />
                ) : null}
                <AppText variant="bodyStrong" color={option.destructive ? "danger" : "text"}>
                  {option.label}
                </AppText>
              </PressableScale>
            ))}
            <PressableScale style={[styles.option, styles.cancel]} onPress={onClose} scaleTo={0.98}>
              <AppText variant="bodyStrong" color="textSecondary" style={{ textAlign: "center", flex: 1 }}>
                Cancel
              </AppText>
            </PressableScale>
          </Animated.View>
        </Animated.View>
      )}
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
  },
  sheet: {
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.md,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: t.colors.border,
    marginBottom: t.spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: t.spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    paddingVertical: 16,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceAlt,
    marginBottom: t.spacing.sm,
  },
  cancel: {
    backgroundColor: "transparent",
  },
}));
