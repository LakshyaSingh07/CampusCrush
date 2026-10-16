import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Alert, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { resizedImageUrl } from "../lib/cloudinary";
import { makeStyles, useTheme } from "../theme";
import { AppText, enter, IconButton, PressableScale } from "../ui";

// Grid of photo slots. Each slot is { url } (already uploaded),
// { uri, mimeType } (picked, not uploaded yet) or null.
export default function PhotoGrid({ photos, onChange, disabled }) {
  const t = useTheme();
  const styles = useStyles();

  const pick = async (index) => {
    if (disabled) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos so you can add them.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (result.canceled) return;
    const { uri, mimeType } = result.assets[0];
    const next = [...photos];
    next[index] = { uri, mimeType };
    onChange(next);
  };

  const remove = (index) => {
    if (disabled) return;
    const next = [...photos];
    next[index] = null;
    onChange(next);
  };

  return (
    <View style={styles.grid}>
      {photos.map((photo, index) => (
        <Animated.View key={index} entering={enter(index)} style={styles.slotWrap}>
          <PressableScale
            style={[styles.slot, !photo && styles.emptySlot]}
            onPress={() => pick(index)}
            haptic="light"
            accessibilityLabel={photo ? `Replace photo ${index + 1}` : `Add photo ${index + 1}`}
          >
            {photo ? (
              <Animated.View entering={FadeIn} style={{ flex: 1 }}>
                <Image
                  source={{ uri: photo.url ? resizedImageUrl(photo.url, 300) : photo.uri }}
                  style={{ flex: 1 }}
                  contentFit="cover"
                  transition={200}
                />
                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <AppText variant="small" color="onPrimary">
                      Main
                    </AppText>
                  </View>
                )}
              </Animated.View>
            ) : (
              <FontAwesome5 name="plus" size={20} color={t.colors.primaryPressed} />
            )}
          </PressableScale>
          {photo && (
            <Animated.View entering={ZoomIn} style={styles.remove}>
              <IconButton
                icon="times"
                size={26}
                iconSize={12}
                color="#fff"
                background="rgba(0,0,0,0.6)"
                onPress={() => remove(index)}
                accessibilityLabel={`Remove photo ${index + 1}`}
              />
            </Animated.View>
          )}
        </Animated.View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: t.spacing.md,
  },
  slotWrap: {
    width: "31.5%",
    aspectRatio: 3 / 4,
  },
  slot: {
    flex: 1,
    borderRadius: t.radius.md,
    overflow: "hidden",
    backgroundColor: t.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySlot: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: t.colors.primary,
    backgroundColor: t.colors.primarySoft,
  },
  mainBadge: {
    position: "absolute",
    left: 6,
    top: 6,
    backgroundColor: t.colors.primary,
    borderRadius: t.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  remove: {
    position: "absolute",
    right: -6,
    top: -6,
  },
}));
