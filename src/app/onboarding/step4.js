// step4.js
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WheelPickerExpo from "react-native-wheel-picker-expo";

export default function Step4() {
  const [selectedHeight, setSelectedHeight] = useState(160);

  const heightOptions = Array.from({ length: 61 }, (_, i) => ({
    label: `${150 + i} cm`,
    value: 150 + i,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBackground}>
        <View style={styles.progressFill} />
      </View>

      {/* Heading */}
      <Text style={styles.title}>Now, let’s talk about you</Text>
      <Text style={styles.subtitle}>
        Let’s get the small talk out of the way. We’ll get into the deep and
        meaningful later.
      </Text>

      {/* Label */}
      <Text style={styles.label}>Your height</Text>

      {/* Wheel Picker */}
      <View style={styles.pickerContainer}>
        <WheelPickerExpo
          height={420}
          width="100%"
          marginTop={50}
          initialSelectedIndex={selectedHeight - 150}
          items={heightOptions}
          onChange={({ item }) => setSelectedHeight(item.value)}
          renderItem={({ label }) => (
            <Text style={styles.pickerItem}>{label}</Text>
          )}
          style={styles.picker}
        />
        {/* Selection Indicator Box */}
        <View style={styles.selectionBox} />
      </View>

      {/* Floating Next Button */}
      <TouchableOpacity style={styles.nextButton}>
        <Ionicons name="arrow-forward" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 70,
    paddingHorizontal: 24,
  },
  progressBackground: {
    height: 3,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    marginBottom: 20,
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    width: "60%", // adjust progress here
    backgroundColor: "black",
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#212529",
  },
  subtitle: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 0,
    color: "#000",
  },
  pickerContainer: {
    marginTop: 20,
    // backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 500,
    marginBottom: 20,
  },
  picker: {
    alignSelf: "center",
    marginTop: 10,
  },
  pickerItem: {
    fontSize: 22,
    textAlign: "center",
    color: "#000",
    fontWeight: "600",
  },
  selectionBox: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    transform: [{ translateY: -35 }],
    height: 70,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    pointerEvents: "none",
  },
  nextButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "black",
    width: 55,
    height: 55,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
