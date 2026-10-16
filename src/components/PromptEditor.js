import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAX_PROMPTS, PROMPT_ANSWER_MAX, PROMPTS } from "../lib/profileOptions";
import { makeStyles, useTheme } from "../theme";
import { AppText, enter, PressableScale, TextField } from "../ui";

// Up to three { prompt, answer } pairs. Tap an empty slot to pick a prompt,
// tap a filled one to edit or remove it.
export default function PromptEditor({ value = [], onChange }) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftPrompt, setDraftPrompt] = useState(null);
  const [draftAnswer, setDraftAnswer] = useState("");

  const open = (index) => {
    setEditingIndex(index);
    setDraftPrompt(value[index]?.prompt ?? null);
    setDraftAnswer(value[index]?.answer ?? "");
  };
  const close = () => setEditingIndex(null);

  const save = () => {
    const next = [...value];
    next[editingIndex] = { prompt: draftPrompt, answer: draftAnswer.trim() };
    onChange(next);
    close();
  };

  const remove = () => {
    onChange(value.filter((_, i) => i !== editingIndex));
    close();
  };

  const usedPrompts = value.filter((_, i) => i !== editingIndex).map((p) => p.prompt);
  const slots = Math.min(value.length + 1, MAX_PROMPTS);
  const canSave = !!draftPrompt && !!draftAnswer.trim();

  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: slots }, (_, i) => {
        const item = value[i];
        return (
          <Animated.View key={i} entering={enter(i)} layout={LinearTransition.springify()}>
            <PressableScale
              style={[styles.slot, !item && styles.emptySlot]}
              onPress={() => open(i)}
              haptic="light"
              scaleTo={0.98}
            >
              {item ? (
                <>
                  <AppText variant="caption" color="primaryPressed" style={{ marginBottom: 4 }}>
                    {item.prompt}
                  </AppText>
                  <AppText variant="title">{item.answer}</AppText>
                </>
              ) : (
                <View style={styles.addRow}>
                  <FontAwesome5 name="plus-circle" size={18} color={t.colors.primaryPressed} solid />
                  <AppText variant="bodyStrong">Add a prompt</AppText>
                </View>
              )}
            </PressableScale>
          </Animated.View>
        );
      })}

      <Modal visible={editingIndex !== null} animationType="slide" onRequestClose={close}>
        <KeyboardAvoidingView
          style={[styles.modal, { paddingTop: insets.top }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalHeader}>
            <PressableScale onPress={close} hitSlop={10}>
              <AppText variant="bodyMedium" color="textSecondary">
                Cancel
              </AppText>
            </PressableScale>
            <AppText variant="title">{draftPrompt ? "Your answer" : "Pick a prompt"}</AppText>
            <PressableScale onPress={save} disabled={!canSave} hitSlop={10} haptic="success">
              <AppText variant="bodyStrong" color={canSave ? "primaryPressed" : "textMuted"}>
                Done
              </AppText>
            </PressableScale>
          </View>

          {draftPrompt ? (
            <Animated.View entering={FadeIn} style={{ padding: 20 }}>
              <PressableScale onPress={() => setDraftPrompt(null)} scaleTo={0.98}>
                <AppText variant="h2">{draftPrompt}</AppText>
                <AppText variant="caption" color="primaryPressed" style={{ marginTop: 4, marginBottom: 16 }}>
                  Change prompt
                </AppText>
              </PressableScale>
              <TextField
                value={draftAnswer}
                onChangeText={setDraftAnswer}
                placeholder="Your answer"
                maxLength={PROMPT_ANSWER_MAX}
                showCount
                multiline
                autoFocus
              />
              {value[editingIndex] && (
                <PressableScale onPress={remove} style={styles.removeButton}>
                  <AppText variant="bodyStrong" color="danger">
                    Remove this prompt
                  </AppText>
                </PressableScale>
              )}
            </Animated.View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 12 }}>
              {PROMPTS.filter((p) => !usedPrompts.includes(p)).map((prompt, i) => (
                <Animated.View key={prompt} entering={enter(i)}>
                  <PressableScale style={styles.promptOption} onPress={() => setDraftPrompt(prompt)} scaleTo={0.98} haptic="select">
                    <AppText variant="bodyMedium" style={{ flex: 1 }}>
                      {prompt}
                    </AppText>
                    <FontAwesome5 name="chevron-right" size={12} color={t.colors.textMuted} />
                  </PressableScale>
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  slot: {
    backgroundColor: t.colors.surface,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
  },
  emptySlot: {
    borderStyle: "dashed",
    borderColor: t.colors.primary,
    backgroundColor: t.colors.primarySoft,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modal: {
    flex: 1,
    backgroundColor: t.colors.bg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: t.spacing.xl,
    paddingVertical: t.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  removeButton: {
    marginTop: t.spacing.xxl,
    alignSelf: "center",
  },
  promptOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
}));
