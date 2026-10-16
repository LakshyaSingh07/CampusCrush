import { Text } from "react-native";
import { useTheme } from "../theme";

// Text in the app font. variant: display | h1 | h2 | title | body | bodyMedium
// | bodyStrong | caption | small | button | label. color: a theme color name
// (e.g. "textSecondary") or any CSS color.
export default function AppText({ variant = "body", color = "text", style, children, ...rest }) {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={[typography[variant], { color: colors[color] ?? color }, style]}
      maxFontSizeMultiplier={1.4}
      {...rest}
    >
      {children}
    </Text>
  );
}
