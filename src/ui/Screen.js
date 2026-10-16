import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";

// Screen container with safe-area padding and the theme background.
// scroll: wrap content in a ScrollView. keyboard: avoid the keyboard on iOS.
export default function Screen({
  children,
  scroll,
  keyboard,
  edges = ["top", "bottom"],
  style,
  contentContainerStyle,
  background = "bg",
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
  };
  const containerStyle = [{ flex: 1, backgroundColor: t.colors[background] ?? background }, padding, style];

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  if (keyboard) {
    return (
      <KeyboardAvoidingView
        style={containerStyle}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }
  return <View style={containerStyle}>{content}</View>;
}
