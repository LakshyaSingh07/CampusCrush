import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { LIFESTYLE_FIELDS } from "../lib/profileOptions";
import Chip from "./Chip";

// Optional lifestyle answers. `values` is keyed by profile column name
// (drinker_status, smoker_status, exercise_status, religion, hometown).
export default function LifestyleFields({ values, onChange }) {
  const set = (key, value) => onChange({ ...values, [key]: value });

  return (
    <View>
      {LIFESTYLE_FIELDS.map((field) => (
        <View key={field.key} style={styles.field}>
          <View style={styles.labelRow}>
            <FontAwesome5 name={field.icon} size={14} color="#495057" />
            <Text style={styles.label}>{field.label}</Text>
          </View>
          <View style={styles.wrap}>
            {field.options.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={values[field.key] === option}
                // Tapping the selected option again clears it
                onPress={() =>
                  set(field.key, values[field.key] === option ? null : option)
                }
              />
            ))}
          </View>
        </View>
      ))}

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <FontAwesome5 name="home" size={14} color="#495057" />
          <Text style={styles.label}>Hometown</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g. Lucknow"
          placeholderTextColor="#adb5bd"
          value={values.hometown ?? ""}
          onChangeText={(text) => set("hometown", text)}
          maxLength={50}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 22,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
});
