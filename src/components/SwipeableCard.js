import { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, Text, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import ProfileCard from "./ProfileCard";

// Drag right to like, left to pass. The parent can also trigger a swipe
// through the ref (for the like/pass buttons): ref.current.swipe("like").
const SwipeableCard = forwardRef(function SwipeableCard(
  { profile, onSwipe, onMorePress, onInfoPress, style },
  ref
) {
  const { width } = useWindowDimensions();
  const threshold = width * 0.28;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const flyOut = (direction) => {
    "worklet";
    const sign = direction === "like" ? 1 : -1;
    translateX.value = withTiming(sign * width * 1.5, { duration: 250 }, () => {
      scheduleOnRN(onSwipe, direction);
    });
  };

  useImperativeHandle(ref, () => ({
    swipe: (direction) => flyOut(direction),
  }));

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const passedThreshold = Math.abs(translateX.value) > threshold;
      const flicked = Math.abs(e.velocityX) > 900;
      if (passedThreshold || flicked) {
        flyOut((flicked ? e.velocityX : translateX.value) > 0 ? "like" : "pass");
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(translateX.value, [-width, width], [-12, 12])}deg`,
      },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-threshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[style, cardStyle]}>
        <ProfileCard
          profile={profile}
          style={styles.fill}
          onMorePress={onMorePress}
          onInfoPress={onInfoPress}
        />
        <Animated.View style={[styles.stamp, styles.likeStamp, likeStyle]} pointerEvents="none">
          <Text style={[styles.stampText, { color: "#2f9e44" }]}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.passStamp, passStyle]} pointerEvents="none">
          <Text style={[styles.stampText, { color: "#e03131" }]}>NOPE</Text>
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
  stamp: {
    position: "absolute",
    top: 50,
    borderWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  likeStamp: {
    left: 24,
    borderColor: "#2f9e44",
    transform: [{ rotate: "-15deg" }],
  },
  passStamp: {
    right: 24,
    borderColor: "#e03131",
    transform: [{ rotate: "15deg" }],
  },
  stampText: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
