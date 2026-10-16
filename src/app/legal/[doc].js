import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { LEGAL_DOCS, LEGAL_LAST_UPDATED } from "../../content/legal";
import { makeStyles } from "../../theme";
import { AppText, enter, IconButton, Screen } from "../../ui";

export default function LegalScreen() {
  const router = useRouter();
  const styles = useStyles();
  const { doc } = useLocalSearchParams();
  const content = LEGAL_DOCS[doc];

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={40} background="surfaceAlt" onPress={() => router.back()} accessibilityLabel="Back" />
        <AppText variant="title">{content?.title ?? "Not found"}</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {content ? (
          <>
            <AppText variant="caption" color="textMuted" style={{ marginBottom: 16 }}>
              Last updated {LEGAL_LAST_UPDATED}
            </AppText>
            {content.sections.map((section, i) => (
              <Animated.View key={section.heading} entering={enter(i)} style={styles.section}>
                <AppText variant="title" style={{ marginBottom: 6 }}>
                  {section.heading}
                </AppText>
                <AppText color="textSecondary">{section.body}</AppText>
              </Animated.View>
            ))}
          </>
        ) : (
          <AppText color="textSecondary">This page doesn&apos;t exist.</AppText>
        )}
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.lg,
    paddingHorizontal: t.spacing.xl,
    paddingVertical: t.spacing.md,
  },
  content: {
    padding: t.spacing.xl,
    paddingBottom: 48,
  },
  section: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    marginBottom: t.spacing.md,
  },
}));
