import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { fonts, gradients, palettes, radius, shadow, spacing, typography } from "./tokens";

export { fonts, gradients, radius, spacing, typography };

// Follows the phone's light/dark setting
export const useTheme = () => {
  const scheme = useColorScheme();
  return useMemo(() => {
    const dark = scheme === "dark";
    const colors = dark ? palettes.dark : palettes.light;
    return {
      dark,
      colors,
      fonts,
      gradients,
      radius,
      spacing,
      typography,
      shadow: (elevation) => shadow(colors, elevation),
    };
  }, [scheme]);
};

// Theme-aware StyleSheet. Define at module level, call inside the component:
//   const useStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.surface } }));
//   const styles = useStyles();
export const makeStyles = (factory) => () => {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
};
