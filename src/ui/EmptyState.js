import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../theme";
import AppText from "./AppText";
import Button from "./Button";
import { enter, pop } from "./motion";

export default function EmptyState({ icon, emoji, title, text, actionTitle, onAction, children, style }) {
  const t = useTheme();
  return (
    <View style={[styles.container, style]}>
      <Animated.View
        entering={pop()}
        style={[styles.iconCircle, { backgroundColor: t.colors.primarySoft }]}
      >
        {emoji ? (
          <AppText style={{ fontSize: 44, lineHeight: 52 }}>{emoji}</AppText>
        ) : (
          <FontAwesome5 name={icon} size={36} color={t.colors.primaryPressed} solid />
        )}
      </Animated.View>
      <Animated.View entering={enter(1)} style={styles.text}>
        <AppText variant="h2" style={{ textAlign: "center" }}>
          {title}
        </AppText>
        {text ? (
          <AppText color="textSecondary" style={{ textAlign: "center", marginTop: 8 }}>
            {text}
          </AppText>
        ) : null}
      </Animated.View>
      {actionTitle ? (
        <Animated.View entering={enter(2)} style={{ marginTop: 24 }}>
          <Button title={actionTitle} onPress={onAction} size="md" />
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 20,
    alignItems: "center",
  },
});
