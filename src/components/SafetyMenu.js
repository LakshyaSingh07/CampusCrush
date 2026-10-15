import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthProvider";
import { REPORT_REASONS } from "../lib/profile";
import { supabase } from "../lib/supabase";
import ActionSheet from "./ActionSheet";

// Unmatch / block / report menu for another user.
// `onDone(action)` is called after a successful action so the caller can drop
// the user from its list ("unmatch" | "block" | "report").
export default function SafetyMenu({
  visible,
  onClose,
  targetUserId,
  targetName,
  matchId,
  onDone,
}) {
  const { user } = useAuth();
  const [reportVisible, setReportVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const confirm = (title, message, actionLabel, run) =>
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: actionLabel, style: "destructive", onPress: run },
    ]);

  const unmatch = () =>
    confirm(
      `Unmatch ${targetName}?`,
      "You won't be able to message each other any more.",
      "Unmatch",
      async () => {
        const { error } = await supabase.rpc("unmatch", {
          p_match_id: matchId,
        });
        if (error) return Alert.alert("Error", error.message);
        onDone?.("unmatch");
      }
    );

  const block = () =>
    confirm(
      `Block ${targetName}?`,
      "They won't be able to see your profile or message you, and you won't see theirs.",
      "Block",
      async () => {
        const { error } = await supabase.rpc("block_user", {
          p_target: targetUserId,
        });
        if (error) return Alert.alert("Error", error.message);
        onDone?.("block");
      }
    );

  const closeReport = () => {
    setReportVisible(false);
    setReason("");
    setDetails("");
  };

  const submitReport = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: targetUserId,
      reason,
      details: details.trim() || null,
    });
    // Reporting also blocks, so the reporter never sees this person again
    const { error: blockError } = error
      ? { error: null }
      : await supabase.rpc("block_user", { p_target: targetUserId });

    setSubmitting(false);
    if (error || blockError) {
      Alert.alert("Error", (error || blockError).message);
      return;
    }
    closeReport();
    Alert.alert(
      "Thanks for letting us know",
      `We'll review your report. You won't see ${targetName} again.`
    );
    onDone?.("report");
  };

  const options = [
    matchId && { label: "Unmatch", onPress: unmatch, destructive: true },
    { label: `Block ${targetName}`, onPress: block, destructive: true },
    {
      label: `Report ${targetName}`,
      onPress: () => setReportVisible(true),
      destructive: true,
    },
  ].filter(Boolean);

  return (
    <>
      <ActionSheet visible={visible} options={options} onClose={onClose} />

      <Modal
        visible={reportVisible}
        animationType="slide"
        transparent
        onRequestClose={closeReport}
      >
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <Text style={styles.title}>Report {targetName}</Text>
            <Text style={styles.subtitle}>
              Your report is anonymous. What&apos;s the problem?
            </Text>

            {REPORT_REASONS.map((r) => (
              <Pressable
                key={r.value}
                style={[styles.reason, reason === r.value && styles.reasonActive]}
                onPress={() => setReason(r.value)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    reason === r.value && styles.reasonTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}

            <TextInput
              style={styles.details}
              placeholder="Add details (optional)"
              placeholderTextColor="#adb5bd"
              value={details}
              onChangeText={setDetails}
              maxLength={1000}
              multiline
            />

            <View style={styles.buttons}>
              <Pressable style={styles.cancelButton} onPress={closeReport}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, !reason && { opacity: 0.4 }]}
                onPress={submitReport}
                disabled={!reason || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Report</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
    marginBottom: 16,
  },
  reason: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  reasonActive: {
    borderColor: "#212529",
  },
  reasonText: {
    fontSize: 15,
    color: "#212529",
  },
  reasonTextActive: {
    fontWeight: "600",
  },
  details: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 10,
    padding: 12,
    minHeight: 70,
    fontSize: 15,
    marginTop: 4,
    textAlignVertical: "top",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    backgroundColor: "#f1f3f5",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    backgroundColor: "#e03131",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
