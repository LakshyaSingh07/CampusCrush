// Design tokens. Warm, Bumble-inspired palette: honey yellow on cream, with
// a coral accent for likes and celebrations.

const light = {
  bg: "#FFFBF2",
  surface: "#FFFFFF",
  surfaceAlt: "#FFF4DC",
  primary: "#FFC83D",
  primaryPressed: "#F2B417",
  primarySoft: "#FFF1C7",
  onPrimary: "#1E1A12",
  accent: "#FF7A59",
  accentSoft: "#FFE4DB",
  text: "#1E1A12",
  textSecondary: "#6E665A",
  textMuted: "#A39A8C",
  border: "#EFE7D8",
  pass: "#F25C54",
  success: "#2F9E44",
  successSoft: "#E6F6EA",
  danger: "#E5484D",
  dangerSoft: "#FDECEC",
  warning: "#D9480F",
  warningSoft: "#FFF0E1",
  verified: "#3B82F6",
  overlay: "rgba(20,16,8,0.45)",
  shadow: "#3A2A00",
  skeleton: "#F3ECDF",
  skeletonHighlight: "#FBF7EF",
};

const dark = {
  bg: "#14120E",
  surface: "#1F1C17",
  surfaceAlt: "#2A251D",
  primary: "#FFC83D",
  primaryPressed: "#F2B417",
  primarySoft: "#3A3020",
  onPrimary: "#1E1A12",
  accent: "#FF8A6B",
  accentSoft: "#3D2620",
  text: "#F6F1E7",
  textSecondary: "#C9C0B1",
  textMuted: "#8C8476",
  border: "#332D24",
  pass: "#FF6B63",
  success: "#51CF66",
  successSoft: "#1F3324",
  danger: "#FF6B6B",
  dangerSoft: "#3A1F1F",
  warning: "#FF922B",
  warningSoft: "#3A2A1A",
  verified: "#60A5FA",
  overlay: "rgba(0,0,0,0.6)",
  shadow: "#000000",
  skeleton: "#2A251D",
  skeletonHighlight: "#353026",
};

export const palettes = { light, dark };

// Gradients used on heroes, the match screen and photo overlays
export const gradients = {
  honey: ["#FFD866", "#FFB347"],
  sunset: ["#FFC83D", "#FF7A59"],
  photoFade: ["transparent", "rgba(0,0,0,0.82)"],
};

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
};

// Custom fonts don't respond to fontWeight, so each variant names its family
export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  h2: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  title: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 23 },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20 },
  label: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: "uppercase" },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const shadow = (colors, elevation = 4) => ({
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: Math.ceil(elevation / 2) },
  shadowOpacity: 0.12,
  shadowRadius: elevation * 2,
  elevation,
});
