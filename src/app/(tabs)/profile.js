import React from "react";
import { Image, StyleSheet, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Rectangle2 from "../../assets/rectangle-2.svg";
import Markemailunread from "../../assets/mark_email_unread.svg";

// If using a local image file (update name if needed)
const BgImage = require("../../assets/mainScreen.png");

export default function SignUpMainScreen() {
  return (
    <SafeAreaView style={styles.viewBg}>
      <View style={[styles.view, styles.viewBg]}>
        <Image
          style={[
            styles.dd4a45f8ca48fb1e9c6f7f987cc1Icon,
            styles.groupChildPosition,
          ]}
          resizeMode="cover"
          source={BgImage}
        />
        <View style={[styles.child, styles.itemPosition]} />
        <View style={[styles.item, styles.itemPosition]} />
        <Text
          style={[styles.welcomeToCampuscrush, styles.placeholderTextFlexBox]}
        >
          {`Welcome to\nCampusCrush`}
        </Text>
        <Pressable
          style={[styles.vectorParent, styles.groupChildLayout]}
          onPress={() => {}}
        >
          <Rectangle2
            style={[styles.groupChild, styles.groupChildLayout]}
            width={312}
            height={45}
          />
          <Text style={[styles.placeholderText, styles.placeholderTextFlexBox]}>
            Continue with email
          </Text>
          <Markemailunread
            style={styles.markEmailUnreadIcon}
            width={20}
            height={20}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  signUpMainScreen: {
    flex: 1,
    backgroundColor: "#fafafc",
  },
  viewBg: {
    backgroundColor: "#fafafc",
    flex: 1,
  },
  groupChildPosition: {
    left: 0,
    top: 0,
  },
  itemPosition: {
    width: 343,
    left: 9,
    position: "absolute",
    backgroundColor: "#fafafc",
  },
  placeholderTextFlexBox: {
    textAlign: "center",
    position: "absolute",
  },
  groupChildLayout: {
    height: 45,
    width: 312,
    position: "absolute",
  },
  dd4a45f8ca48fb1e9c6f7f987cc1Icon: {
    width: 360,
    position: "absolute",
    height: 800,
  },
  child: {
    top: 154,
    height: 124,
  },
  item: {
    top: 541,
    height: 167,
  },
  welcomeToCampuscrush: {
    top: 171,
    left: 22,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "700",
    fontFamily: "Poppins-Bold",
    color: "#4e4e4e",
  },
  groupChild: {
    borderRadius: 40,
    left: 0,
    top: 0,
  },
  placeholderText: {
    top: 16,
    left: 100,
    fontSize: 14,
    lineHeight: 16,
    fontFamily: "Poppins-Regular",
    color: "#232139",
  },
  markEmailUnreadIcon: {
    top: 14,
    left: 72,
    width: 20,
    height: 20,
    position: "absolute",
  },
  vectorParent: {
    top: 548,
    left: 24,
  },
  view: {
    width: "100%",
    overflow: "hidden",
    height: 800,
  },
});
