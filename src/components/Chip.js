import { makeStyles } from "../theme";
import { AppText, PressableScale } from "../ui";

// Selectable pill. Without onPress it renders as a static tag.
export default function Chip({ label, selected, onPress, disabled, style }) {
  const styles = useStyles();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || !onPress}
      haptic={onPress ? "select" : undefined}
      scaleTo={0.94}
      style={[styles.chip, selected && styles.selected, disabled && !selected && styles.disabled, style]}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
    >
      <AppText variant={selected ? "bodyStrong" : "bodyMedium"} color={selected ? "onPrimary" : "text"} style={styles.text}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  chip: {
    borderWidth: 1.5,
    borderColor: t.colors.border,
    borderRadius: t.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: t.colors.surface,
  },
  selected: {
    borderColor: t.colors.primary,
    backgroundColor: t.colors.primary,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 15,
  },
}));
