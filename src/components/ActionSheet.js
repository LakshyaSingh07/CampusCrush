import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Bottom sheet with a list of actions. Used instead of Alert.alert because
// Android alerts can show at most three buttons.
export default function ActionSheet({ visible, title, options, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {options.map((option) => (
                <Pressable
                  key={option.label}
                  style={styles.option}
                  onPress={() => {
                    onClose();
                    // iOS drops alerts/modals presented while another modal
                    // is still animating out
                    setTimeout(option.onPress, 350);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      option.destructive && styles.destructive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={[styles.option, styles.cancel]} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 8,
  },
  option: {
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dee2e6",
  },
  optionText: {
    fontSize: 17,
    color: "#212529",
  },
  destructive: {
    color: "#e03131",
    fontWeight: "600",
  },
  cancel: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 17,
    color: "#495057",
    fontWeight: "600",
  },
});
