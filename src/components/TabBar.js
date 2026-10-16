import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEntitlements } from "../context/EntitlementsProvider";
import { makeStyles, useTheme } from "../theme";
import { AppText, PressableScale, SPRING } from "../ui";

const ICONS = {
  home: "fire",
  "liked-you": "heart",
  chats: "comment-dots",
  profile: "user",
};

function TabItem({ route, label, focused, onPress, badge }) {
  const t = useTheme();
  const styles = useStyles();

  const pillStyle = useAnimatedStyle(() => ({
    opacity: withSpring(focused ? 1 : 0, SPRING),
    transform: [{ scale: withSpring(focused ? 1 : 0.6, SPRING) }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(focused ? -1 : 0, SPRING) }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      haptic="select"
      scaleTo={0.9}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.pill, pillStyle]} />
        <Animated.View style={iconStyle}>
          <FontAwesome5
            name={ICONS[route.name] ?? "circle"}
            size={20}
            solid
            color={focused ? t.colors.onPrimary : t.colors.textMuted}
          />
        </Animated.View>
        {badge ? (
          <View style={styles.badge}>
            <AppText variant="small" color="#fff" style={styles.badgeText}>
              {badge > 99 ? "99+" : badge}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="small" color={focused ? "text" : "textMuted"} style={styles.label}>
        {label}
      </AppText>
    </PressableScale>
  );
}

export default function TabBar({ state, descriptors, navigation }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { liked_me_count } = useEntitlements();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <TabItem
            key={route.key}
            route={route}
            label={options.title ?? route.name}
            focused={focused}
            onPress={onPress}
            badge={route.name === "liked-you" ? liked_me_count : 0}
          />
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    flexDirection: "row",
    backgroundColor: t.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.border,
    paddingTop: 8,
    ...t.shadow(8),
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
  },
  label: {
    marginTop: 3,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: t.colors.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: t.colors.surface,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
}));
