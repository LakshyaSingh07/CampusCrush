import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// A lightweight select field built with a modal list to avoid extra deps
export default function SelectField({ label, placeholder, value, options, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.select} onPress={() => setIsOpen(true)}>
        <Text style={[styles.selectText, !value && { color: "#adb5bd" }]}>
          {value || placeholder}
        </Text>
        <FontAwesome5 name="chevron-down" size={14} color="#495057" />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>
                <Text style={styles.sheetTitle}>{label}</Text>
                <ScrollView style={styles.optionList}>
                  {options.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        onSelect(option);
                        setIsOpen(false);
                      }}
                      style={styles.option}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          option === value && styles.optionSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 8,
  },
  select: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: {
    fontSize: 16,
    color: "#212529",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#343a40",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  optionList: {
    paddingVertical: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
    color: "#212529",
  },
  optionSelected: {
    fontWeight: "700",
    color: "#7B61FF",
  },
});
