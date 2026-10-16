import { useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthProvider";
import { REPORT_REASONS } from "../lib/profile";
import { supabase } from "../lib/supabase";
import { makeStyles } from "../theme";
import { AppText, Button, haptics, TextField } from "../ui";
import ActionSheet from "./ActionSheet";
import ChoiceCard from "./ChoiceCard";

// Unmatch / block / report menu for another user.
// `onDone(action)` is called after a successful action so the caller can drop
// the user from its list ("unmatch" | "block" | "report").
export default function SafetyMenu({ visible, onClose, targetUserId, targetName, matchId, onDone }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
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
    confirm(`Unmatch ${targetName}?`, "You won't be able to message each other any more.", "Unmatch", async () => {
      const { error } = await supabase.rpc("unmatch", { p_match_id: matchId });
      if (error) return Alert.alert("Error", error.message);
      haptics.success();
      onDone?.("unmatch");
    });

  const block = () =>
    confirm(
      `Block ${targetName}?`,
      "They won't be able to see your profile or message you, and you won't see theirs.",
      "Block",
      async () => {
        const { error } = await supabase.rpc("block_user", { p_target: targetUserId });
        if (error) return Alert.alert("Error", error.message);
        haptics.success();
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
    haptics.success();
    closeReport();
    Alert.alert("Thanks for letting us know", `We'll review your report. You won't see ${targetName} again.`);
    onDone?.("report");
  };

  const options = [
    matchId && { label: "Unmatch", icon: "heart-broken", onPress: unmatch, destructive: true },
    { label: `Block ${targetName}`, icon: "ban", onPress: block, destructive: true },
    { label: `Report ${targetName}`, icon: "flag", onPress: () => setReportVisible(true), destructive: true },
  ].filter(Boolean);

  return (
    <>
      <ActionSheet visible={visible} options={options} onClose={onClose} />

      <Modal visible={reportVisible} animationType="none" transparent onRequestClose={closeReport}>
        {reportVisible && (
          <Animated.View entering={FadeIn} style={styles.backdrop}>
            <Pressable style={{ flex: 1 }} onPress={closeReport} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <Animated.View entering={SlideInDown.springify().damping(20)} style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.handle} />
                <ScrollView keyboardShouldPersistTaps="handled">
                  <AppText variant="h2">Report {targetName}</AppText>
                  <AppText color="textSecondary" style={{ marginTop: 4, marginBottom: 16 }}>
                    Your report is anonymous. What&apos;s the problem?
                  </AppText>

                  <View style={{ gap: 8 }}>
                    {REPORT_REASONS.map((r) => (
                      <ChoiceCard key={r.value} label={r.label} selected={reason === r.value} onPress={() => setReason(r.value)} />
                    ))}
                  </View>

                  <TextField
                    style={{ marginTop: 16 }}
                    placeholder="Add details (optional)"
                    value={details}
                    onChangeText={setDetails}
                    maxLength={1000}
                    multiline
                  />

                  <View style={styles.buttons}>
                    <Button title="Cancel" variant="secondary" onPress={closeReport} style={{ flex: 1 }} size="md" />
                    <Button
                      title="Report"
                      variant="danger"
                      onPress={submitReport}
                      disabled={!reason}
                      loading={submitting}
                      style={{ flex: 1 }}
                      size="md"
                    />
                  </View>
                </ScrollView>
              </Animated.View>
            </KeyboardAvoidingView>
          </Animated.View>
        )}
      </Modal>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    padding: t.spacing.xl,
    paddingTop: t.spacing.md,
    maxHeight: "88%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: t.colors.border,
    marginBottom: t.spacing.lg,
  },
  buttons: {
    flexDirection: "row",
    gap: t.spacing.md,
    marginTop: t.spacing.lg,
  },
}));
