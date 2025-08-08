import { Alert, Pressable, StyleSheet, Text, View } from "react-native"; // 1. Import Alert
import { supabase } from "../../lib/supabase";

export default function ProfileScreen() {
  // 2. Create a function to show the confirmation dialog
  const showConfirmationAlert = () => {
    Alert.alert(
      "Delete Account", // Title
      "Are you sure you want to delete your account? This action cannot be undone.", // Message
      [
        // Button Array
        {
          text: "Cancel",
          onPress: () => console.log("Deletion cancelled"),
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => deleteAccount(), // Call the delete function if confirmed
          style: "destructive",
        },
      ],
      { cancelable: true } // Allows user to tap outside the alert to cancel
    );
  };

  // 3. Create the function to handle the actual deletion
  const deleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke("delete-user");
      if (error) {
        Alert.alert("Error", `Failed to delete account: ${error.message}`);
      } else {
        Alert.alert("Success", "Your account has been successfully deleted.");
        // The onAuthStateChange listener in your AuthProvider will handle the redirect.
      }
    } catch (e) {
      Alert.alert("Error", `An unexpected error occurred: ${e.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.logoutButton}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={{ color: "white" }}>Force Logout</Text>
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={showConfirmationAlert} // 4. Call our new confirmation function
      >
        <Text style={{ color: "white" }}>Delete Account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 24, fontWeight: "bold" },
  logoutButton: {
    position: "absolute",
    bottom: 120,
    left: 24,
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
  },
  deleteButton: {
    position: "absolute",
    bottom: 120,
    right: 24,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
});
