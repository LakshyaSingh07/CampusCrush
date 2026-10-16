import { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";

// Shared spring and entrance presets so motion feels consistent everywhere
export const SPRING = { damping: 16, stiffness: 220, mass: 0.6 };
export const SOFT_SPRING = { damping: 20, stiffness: 140 };

// Staggered entrance for list items: entering={enter(index)}
export const enter = (index = 0) =>
  FadeInDown.springify().damping(18).stiffness(160).delay(Math.min(index, 12) * 50);

export const enterUp = (index = 0) =>
  FadeInUp.springify().damping(18).stiffness(160).delay(Math.min(index, 12) * 50);

export const pop = (delay = 0) => ZoomIn.springify().damping(12).stiffness(180).delay(delay);
