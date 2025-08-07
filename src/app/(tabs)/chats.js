import { View, Text, StyleSheet } from "react-native";

export default function ChatScreen() {
  // Change to ProfileScreen for profile.js
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chat Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 24, fontWeight: "bold" },
});
