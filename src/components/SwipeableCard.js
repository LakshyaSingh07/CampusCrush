import { forwardRef, useEffect, useImperativeHandle } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "../theme";
import { AppText, haptics } from "../ui";
import ProfileCard from "./ProfileCard";
import ProfileContent from "./ProfileContent";

// Drag right to like, left to pass. The parent can also trigger a swipe
// through the ref (for the buttons): ref.current.swipe("like").
// `dragX` (optional shared value) mirrors the horizontal drag so the card
// underneath can react to it.
// `scrollable` shows the whole profile (ProfileContent) instead of a single
// card: vertical drags scroll it, horizontal drags swipe.
const SwipeableCard = forwardRef(function SwipeableCard(
  { profile, onSwipe, onMorePress, onInfoPress, dragX, style, scrollable, bottomInset },
  ref
) {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const threshold = width * 0.28;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const pastThreshold = useSharedValue(0);
  // 0 → 1 while a SuperSwipe flies the card up, to show the star stamp
  const superProgress = useSharedValue(0);

  useEffect(() => {
    if (dragX) dragX.value = 0;
  }, [dragX]);

  const flyOut = (direction) => {
    "worklet";
    if (direction === "superlike") {
      // Show the star for a beat, then fly straight up
      superProgress.value = withTiming(1, { duration: 180 });
      translateY.value = withDelay(
        220,
        withTiming(-height * 1.2, { duration: 320 }, () => {
          scheduleOnRN(onSwipe, direction);
        })
      );
      return;
    }
    const sign = direction === "like" ? 1 : -1;
    translateX.value = withTiming(sign * width * 1.5, { duration: 260 }, () => {
      scheduleOnRN(onSwipe, direction);
    });
    translateY.value = withTiming(translateY.value + 40, { duration: 260 });
  };

  const swipeHaptic = (direction) =>
    direction === "superlike" ? haptics.success() : direction === "like" ? haptics.medium() : haptics.light();

  useImperativeHandle(ref, () => ({
    swipe: (direction) => {
      swipeHaptic(direction);
      flyOut(direction);
    },
  }));

  // Mirror the drag for the card underneath and tick once at the threshold
  useAnimatedReaction(
    () => translateX.value,
    (x) => {
      if (dragX) dragX.value = x;
      const side = x > threshold ? 1 : x < -threshold ? -1 : 0;
      if (side !== pastThreshold.value) {
        pastThreshold.value = side;
        if (side !== 0) scheduleOnRN(haptics.select);
      }
    }
  );

  const pan = Gesture.Pan()
    .activeOffsetX(scrollable ? [-20, 20] : [-15, 15])
    // In scrollable mode a mostly-vertical drag belongs to the ScrollView
    .failOffsetY(scrollable ? [-12, 12] : [-1000, 1000])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = scrollable ? 0 : e.translationY * 0.6;
    })
    .onEnd((e) => {
      const passedThreshold = Math.abs(translateX.value) > threshold;
      const flicked = Math.abs(e.velocityX) > 900;
      if (passedThreshold || flicked) {
        const direction = (flicked ? e.velocityX : translateX.value) > 0 ? "like" : "pass";
        scheduleOnRN(swipeHaptic, direction);
        flyOut(direction);
      } else {
        translateX.value = withSpring(0, { damping: 14, stiffness: 180 });
        translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-width, width], [-14, 14])}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, threshold], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [0, threshold], [0.7, 1], Extrapolation.CLAMP) }, { rotate: "-14deg" }],
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-threshold, -20], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [-threshold, 0], [1, 0.7], Extrapolation.CLAMP) }, { rotate: "14deg" }],
  }));
  const likeTint = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, threshold * 1.5], [0, 0.25], Extrapolation.CLAMP),
  }));
  const passTint = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-threshold * 1.5, 0], [0.25, 0], Extrapolation.CLAMP),
  }));
  const superStyle = useAnimatedStyle(() => ({
    opacity: superProgress.value,
    transform: [{ scale: interpolate(superProgress.value, [0, 1], [0.5, 1]) }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[style, !scrollable && styles.shadow, cardStyle]}>
        {scrollable ? (
          // Opaque so the next profile underneath doesn't show between sections
          <View style={[styles.fill, { backgroundColor: t.colors.bg }]}>
            <ProfileContent profile={profile} onMorePress={onMorePress} bottomInset={bottomInset} gesture animate={false} />
          </View>
        ) : (
          <ProfileCard profile={profile} style={styles.fill} onMorePress={onMorePress} onInfoPress={onInfoPress} />
        )}
        <Animated.View style={[styles.tint, { backgroundColor: t.colors.primary }, likeTint]} pointerEvents="none" />
        <Animated.View style={[styles.tint, { backgroundColor: t.colors.pass }, passTint]} pointerEvents="none" />
        <Animated.View style={[styles.stamp, styles.likeStamp, { borderColor: t.colors.primary }, likeStyle]} pointerEvents="none">
          <AppText variant="h1" color={t.colors.primary} style={styles.stampText}>
            LIKE
          </AppText>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.passStamp, { borderColor: t.colors.pass }, passStyle]} pointerEvents="none">
          <AppText variant="h1" color={t.colors.pass} style={styles.stampText}>
            NOPE
          </AppText>
        </Animated.View>
        <Animated.View style={[styles.superStamp, { backgroundColor: t.colors.verified }, superStyle]} pointerEvents="none">
          <AppText variant="h1" color="#FFFFFF" style={styles.stampText}>
            ⭐ SUPER
          </AppText>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

export default SwipeableCard;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  shadow: {
    shadowColor: "#3A2A00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  stamp: {
    position: "absolute",
    top: 56,
    borderWidth: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  superStamp: {
    position: "absolute",
    top: 140,
    alignSelf: "center",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  likeStamp: {
    left: 26,
  },
  passStamp: {
    right: 26,
  },
  stampText: {
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 3,
  },
});
