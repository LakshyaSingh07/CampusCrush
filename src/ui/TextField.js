import { forwardRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../theme";
import AppText from "./AppText";

// Labeled text input with a honey focus ring and optional character counter
const TextField = forwardRef(function TextField(
  { label, hint, error, showCount, maxLength, value, style, inputStyle, multiline, onFocus, onBlur, ...rest },
  ref
) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? (
        <AppText variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={ref}
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        placeholderTextColor={t.colors.textMuted}
        selectionColor={t.colors.primary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          t.typography.body,
          styles.input,
          {
            color: t.colors.text,
            backgroundColor: t.colors.surface,
            borderColor: error ? t.colors.danger : focused ? t.colors.primary : t.colors.border,
            borderRadius: t.radius.md,
          },
          multiline && styles.multiline,
          inputStyle,
        ]}
        {...rest}
      />
      {(hint || error || showCount) && (
        <View style={styles.footer}>
          <AppText variant="small" color={error ? "danger" : "textMuted"} style={{ flex: 1 }}>
            {error || hint || ""}
          </AppText>
          {showCount && maxLength ? (
            <AppText variant="small" color="textMuted">
              {(value ?? "").length}/{maxLength}
            </AppText>
          ) : null}
        </View>
      )}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    marginTop: 6,
  },
});
