import { FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { LEGAL_DOCS, LEGAL_LAST_UPDATED } from "../../content/legal";

export default function LegalScreen() {
  const router = useRouter();
  const { doc } = useLocalSearchParams();
  const content = LEGAL_DOCS[doc];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <FontAwesome5 name="arrow-left" size={20} color="#212529" />
        </Pressable>
        <Text style={styles.headerTitle}>{content?.title ?? "Not found"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {content ? (
          <>
            <Text style={styles.updated}>Last updated {LEGAL_LAST_UPDATED}</Text>
            {content.sections.map((section) => (
              <View key={section.heading} style={styles.section}>
                <Text style={styles.heading}>{section.heading}</Text>
                <Text style={styles.body}>{section.body}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.body}>This page doesn&apos;t exist.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dee2e6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  updated: {
    fontSize: 13,
    color: "#adb5bd",
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 6,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#495057",
  },
});
