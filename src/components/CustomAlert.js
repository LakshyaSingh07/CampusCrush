import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const CustomAlert = ({ visible, title, message, buttons }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        // This is required for Android back button to close the modal
        const onCancel = buttons.find((b) => b.style === "cancel")?.onPress;
        if (onCancel) {
          onCancel();
        }
      }}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <Pressable
                key={index}
                style={[
                  styles.button,
                  button.style === "primary"
                    ? styles.buttonPrimary
                    : styles.buttonDefault,
                  buttons.length > 1 && { flex: 1 }, // Make buttons share space if more than one
                ]}
                onPress={button.onPress}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === "primary"
                      ? styles.buttonTextPrimary
                      : styles.buttonTextDefault,
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    width: "85%",
    maxWidth: 320,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    gap: 12, // Adds space between buttons
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: "#7B61FF", // Your primary purple color
  },
  buttonDefault: {
    backgroundColor: "#e9ecef", // A light grey for secondary actions
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextPrimary: {
    color: "white",
  },
  buttonTextDefault: {
    color: "#495057",
  },
});

export default CustomAlert;
