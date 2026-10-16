import { StyleSheet, Text, View } from "react-native";
import { INTEREST_TAGS, MAX_INTERESTS } from "../lib/profileOptions";
import Chip from "./Chip";

export default function InterestPicker({ value = [], onChange }) {
  const toggle = (tag) =>
    onChange(
      value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]
    );
  const isFull = value.length >= MAX_INTERESTS;

  return (
    <View>
      <Text style={styles.counter}>
        {value.length}/{MAX_INTERESTS} selected
      </Text>
      <View style={styles.wrap}>
        {INTEREST_TAGS.map((tag) => {
          const selected = value.includes(tag);
          return (
            <Chip
              key={tag}
              label={tag}
              selected={selected}
              disabled={isFull && !selected}
              onPress={() => toggle(tag)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    fontSize: 13,
    color: "#7B61FF",
    fontWeight: "600",
    marginBottom: 12,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
