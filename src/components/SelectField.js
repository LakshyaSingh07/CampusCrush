import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, useTheme } from "../theme";
import { AppText, PressableScale } from "../ui";

// Field that opens a bottom sheet of options
export default function SelectField({ label, placeholder, value, options, onSelect }) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={{ marginBottom: 20 }}>
      {label ? (
        <AppText variant="caption" color="textSecondary" style={{ marginBottom: 8 }}>
          {label}
        </AppText>
      ) : null}
      <PressableScale style={styles.select} onPress={() => setIsOpen(true)} scaleTo={0.98} haptic="select">
        <AppText variant="bodyMedium" color={value ? "text" : "textMuted"}>
          {value || placeholder}
        </AppText>
        <FontAwesome5 name="chevron-down" size={13} color={t.colors.textSecondary} />
      </PressableScale>

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={() => setIsOpen(false)}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            exiting={SlideOutDown}
            style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
          >
            <View style={styles.handle} />
            <AppText variant="title" style={styles.sheetTitle}>
              {label}
            </AppText>
            <ScrollView>
              {options.map((option) => {
                const selected = option === value;
                return (
                  <PressableScale
                    key={option}
                    scaleTo={0.98}
                    haptic="select"
                    onPress={() => {
                      onSelect(option);
                      setIsOpen(false);
                    }}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <AppText variant={selected ? "bodyStrong" : "body"}>{option}</AppText>
                    {selected && <FontAwesome5 name="check" size={14} color={t.colors.primaryPressed} />}
                  </PressableScale>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  select: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: t.colors.surface,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    borderRadius: t.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
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
    maxHeight: "70%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: t.colors.border,
    marginBottom: t.spacing.md,
  },
  sheetTitle: {
    paddingHorizontal: t.spacing.sm,
    marginBottom: t.spacing.sm,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: t.radius.md,
  },
  optionSelected: {
    backgroundColor: t.colors.primarySoft,
  },
}));
