import { View } from "react-native";
import { INTEREST_TAGS, MAX_INTERESTS } from "../lib/profileOptions";
import { makeStyles } from "../theme";
import { AppText, haptics } from "../ui";
import Chip from "./Chip";

export default function InterestPicker({ value = [], onChange }) {
  const styles = useStyles();
  const isFull = value.length >= MAX_INTERESTS;

  const toggle = (tag) => {
    if (!value.includes(tag) && isFull) {
      haptics.warning();
      return;
    }
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  return (
    <View>
      <View style={styles.counter}>
        <AppText variant="caption" color="onPrimary">
          {value.length}/{MAX_INTERESTS} selected
        </AppText>
      </View>
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

const useStyles = makeStyles((t) => ({
  counter: {
    alignSelf: "flex-start",
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: t.spacing.lg,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: t.spacing.sm,
  },
}));
