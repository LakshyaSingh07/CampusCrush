import { FontAwesome5 } from "@expo/vector-icons";
import { View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { makeStyles, useTheme } from "../theme";
import { AppText, PressableScale, SPRING } from "../ui";

// Large tappable option with a radio check that pops in when selected
export default function ChoiceCard({ label, emoji, selected, onPress }) {
  const t = useTheme();
  const styles = useStyles();
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1 : 0, SPRING) }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      haptic="select"
      scaleTo={0.97}
      style={[styles.card, selected && styles.selected]}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
    >
      {emoji ? <AppText style={styles.emoji}>{emoji}</AppText> : null}
      <AppText variant={selected ? "bodyStrong" : "bodyMedium"} style={{ flex: 1, fontSize: 17 }}>
        {label}
      </AppText>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        <Animated.View style={checkStyle}>
          <FontAwesome5 name="check" size={11} color={t.colors.onPrimary} />
        </Animated.View>
      </View>
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: t.colors.surface,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    borderRadius: t.radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  selected: {
    borderColor: t.colors.primary,
    backgroundColor: t.colors.primarySoft,
  },
  emoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: t.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: t.colors.primary,
    backgroundColor: t.colors.primary,
  },
}));
