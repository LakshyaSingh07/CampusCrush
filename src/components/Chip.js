import { Pressable, StyleSheet, Text } from "react-native";

// Selectable pill. Without onPress it renders as a static tag.
export default function Chip({ label, selected, onPress, disabled, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[
        styles.chip,
        selected && styles.selected,
        disabled && !selected && styles.disabled,
        style,
      ]}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  selected: {
    borderColor: "#7B61FF",
    backgroundColor: "#f3f0ff",
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 15,
    color: "#212529",
  },
  selectedText: {
    color: "#5f3dc4",
    fontWeight: "600",
  },
});
