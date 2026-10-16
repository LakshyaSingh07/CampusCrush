import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MAX_PROMPTS, PROMPT_ANSWER_MAX, PROMPTS } from "../lib/profileOptions";

// Up to three { prompt, answer } pairs. Tap an empty slot to pick a prompt,
// tap a filled one to edit or remove it.
export default function PromptEditor({ value = [], onChange }) {
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

  const usedPrompts = value
    .filter((_, i) => i !== editingIndex)
    .map((p) => p.prompt);
  const slots = Math.min(value.length + 1, MAX_PROMPTS);

  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: slots }, (_, i) => {
        const item = value[i];
        return (
          <Pressable key={i} style={[styles.slot, !item && styles.emptySlot]} onPress={() => open(i)}>
            {item ? (
              <>
                <Text style={styles.slotPrompt}>{item.prompt}</Text>
                <Text style={styles.slotAnswer}>{item.answer}</Text>
              </>
            ) : (
              <View style={styles.addRow}>
                <FontAwesome5 name="plus" size={14} color="#7B61FF" />
                <Text style={styles.addText}>Add a prompt</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      <Modal visible={editingIndex !== null} animationType="slide" onRequestClose={close}>
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={close} hitSlop={10}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{draftPrompt ? "Your answer" : "Pick a prompt"}</Text>
            <Pressable
              onPress={save}
              disabled={!draftPrompt || !draftAnswer.trim()}
              hitSlop={10}
            >
              <Text style={[styles.done, (!draftPrompt || !draftAnswer.trim()) && { opacity: 0.3 }]}>
                Done
              </Text>
            </Pressable>
          </View>

          {draftPrompt ? (
            <View style={{ padding: 20 }}>
              <Pressable onPress={() => setDraftPrompt(null)}>
                <Text style={styles.chosenPrompt}>{draftPrompt}</Text>
                <Text style={styles.change}>Change prompt</Text>
              </Pressable>
              <TextInput
                style={styles.answer}
                value={draftAnswer}
                onChangeText={setDraftAnswer}
                placeholder="Your answer"
                placeholderTextColor="#adb5bd"
                maxLength={PROMPT_ANSWER_MAX}
                multiline
                autoFocus
              />
              <Text style={styles.counter}>
                {draftAnswer.length}/{PROMPT_ANSWER_MAX}
              </Text>
              {value[editingIndex] && (
                <Pressable onPress={remove} style={styles.removeButton}>
                  <Text style={styles.removeText}>Remove this prompt</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 12 }}>
              {PROMPTS.filter((p) => !usedPrompts.includes(p)).map((prompt) => (
                <Pressable key={prompt} style={styles.promptOption} onPress={() => setDraftPrompt(prompt)}>
                  <Text style={styles.promptOptionText}>{prompt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 14,
    padding: 16,
  },
  emptySlot: {
    borderStyle: "dashed",
    borderColor: "#b197fc",
  },
  slotPrompt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7B61FF",
    marginBottom: 4,
  },
  slotAnswer: {
    fontSize: 17,
    color: "#212529",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7B61FF",
  },
  modal: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dee2e6",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212529",
  },
  cancel: {
    fontSize: 16,
    color: "#6c757d",
  },
  done: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7B61FF",
  },
  chosenPrompt: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  change: {
    fontSize: 13,
    color: "#7B61FF",
    marginTop: 4,
    marginBottom: 16,
  },
  answer: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 14,
    minHeight: 110,
    fontSize: 17,
    textAlignVertical: "top",
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#adb5bd",
    marginTop: 4,
  },
  removeButton: {
    marginTop: 24,
    alignSelf: "center",
  },
  removeText: {
    color: "#e03131",
    fontSize: 15,
    fontWeight: "600",
  },
  promptOption: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dee2e6",
  },
  promptOptionText: {
    fontSize: 16,
    color: "#212529",
  },
});
