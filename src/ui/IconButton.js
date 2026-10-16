import { FontAwesome5 } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import { useTheme } from "../theme";
import PressableScale from "./PressableScale";

// Round icon button. `color`/`background` accept theme color names.
export default function IconButton({
  icon,
  size = 48,
  iconSize,
  color = "text",
  background = "surface",
  solid = true,
  loading,
  elevated,
  style,
  haptic = "light",
  ...rest
}) {
  const t = useTheme();
  const fg = t.colors[color] ?? color;
  return (
    <PressableScale
      haptic={haptic}
      scaleTo={0.88}
      accessibilityRole="button"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: t.colors[background] ?? background,
          justifyContent: "center",
          alignItems: "center",
        },
        elevated && t.shadow(4),
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <FontAwesome5 name={icon} size={iconSize ?? Math.round(size * 0.42)} color={fg} solid={solid} />
      )}
    </PressableScale>
  );
}
