import { FontAwesome5 } from "@expo/vector-icons";
import { View } from "react-native";
import { LIFESTYLE_FIELDS } from "../lib/profileOptions";
import { makeStyles, useTheme } from "../theme";
import { AppText, TextField } from "../ui";
import Chip from "./Chip";

// Optional lifestyle answers. `values` is keyed by profile column name
// (drinker_status, smoker_status, exercise_status, religion, hometown).
export default function LifestyleFields({ values, onChange }) {
  const t = useTheme();
  const styles = useStyles();
  const set = (key, value) => onChange({ ...values, [key]: value });

  return (
    <View>
      {LIFESTYLE_FIELDS.map((field) => (
        <View key={field.key} style={styles.field}>
          <View style={styles.labelRow}>
            <View style={styles.icon}>
              <FontAwesome5 name={field.icon} size={13} color={t.colors.primaryPressed} />
            </View>
            <AppText variant="title" style={{ fontSize: 16 }}>
              {field.label}
            </AppText>
          </View>
          <View style={styles.wrap}>
            {field.options.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={values[field.key] === option}
                // Tapping the selected option again clears it
                onPress={() => set(field.key, values[field.key] === option ? null : option)}
              />
            ))}
          </View>
        </View>
      ))}

      <TextField
        label="Hometown"
        placeholder="e.g. Lucknow"
        value={values.hometown ?? ""}
        onChangeText={(text) => set("hometown", text)}
        maxLength={50}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  field: {
    marginBottom: t.spacing.xxl,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.sm,
    marginBottom: t.spacing.md,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: t.colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.spacing.sm,
  },
}));
