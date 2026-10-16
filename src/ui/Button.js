import { FontAwesome5 } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../theme";
import AppText from "./AppText";
import PressableScale from "./PressableScale";

// variant: primary (honey) | dark | secondary (outlined) | ghost | danger
export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  loading,
  disabled,
  style,
  haptic = "light",
  ...rest
}) {
  const t = useTheme();
  const v = {
    primary: { bg: t.colors.primary, fg: t.colors.onPrimary, border: "transparent" },
    dark: { bg: t.colors.text, fg: t.colors.bg, border: "transparent" },
    secondary: { bg: t.colors.surface, fg: t.colors.text, border: t.colors.border },
    ghost: { bg: "transparent", fg: t.colors.text, border: "transparent" },
    danger: { bg: t.colors.dangerSoft, fg: t.colors.danger, border: "transparent" },
  }[variant];
  const height = size === "lg" ? 56 : size === "md" ? 46 : 38;
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      haptic={haptic}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        { height, backgroundColor: v.bg, borderColor: v.border, borderRadius: t.radius.pill },
        variant === "primary" && t.shadow(3),
        disabled && { opacity: 0.45 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <FontAwesome5 name={icon} size={size === "sm" ? 13 : 16} color={v.fg} solid /> : null}
          <AppText variant="button" color={v.fg} style={size === "sm" && { fontSize: 14 }}>
            {title}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
