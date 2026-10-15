import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import SafetyMenu from "../../components/SafetyMenu";
import { useAuth } from "../../context/AuthProvider";
import { resizedImageUrl } from "../../lib/cloudinary";
import { setActiveChat } from "../../lib/notifications";
import { supabase } from "../../lib/supabase";

const PAGE_SIZE = 100;
const MAX_LENGTH = 2000;

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { matchId, name, photo, otherUserId } = useLocalSearchParams();

  // Newest first, rendered with an inverted list
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  const markRead = useCallback(() => {
    supabase.rpc("mark_match_read", { p_match_id: matchId });
  }, [matchId]);

  useEffect(() => {
    let isMounted = true;
    setActiveChat(matchId);

    const load = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (!isMounted) return;
      if (error) Alert.alert("Error", error.message);
      else setMessages(data);
      setLoading(false);
      markRead();
    };
    load();

    // Our own messages are added from the insert response, so only the other
    // person's messages need to come from realtime.
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        ({ new: message }) => {
          if (message.sender_id === user?.id) return;
          setMessages((prev) =>
            prev.some((m) => m.id === message.id) ? prev : [message, ...prev]
          );
          markRead();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      setActiveChat(null);
      supabase.removeChannel(channel);
    };
  }, [matchId, user?.id, markRead]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");

    // Show the message straight away, then swap in the saved row
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      sender_id: user.id,
      body,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: user.id, body })
      .select("id, sender_id, body, created_at")
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(body);
      // RLS rejects inserts once the match has ended (unmatch or block)
      Alert.alert(
        "Message not sent",
        error.code === "42501"
          ? "This conversation is no longer available."
          : error.message
      );
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
  };

  const renderMessage = ({ item, index }) => {
    const mine = item.sender_id === user?.id;
    // The list is inverted, so the visually previous message is index + 1
    const older = messages[index + 1];
    const showTime =
      !older || new Date(item.created_at) - new Date(older.created_at) > 15 * 60000;

    return (
      <View>
        {showTime && (
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleString([], {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
        )}
        <View
          style={[
            styles.bubble,
            mine ? styles.myBubble : styles.theirBubble,
            item.pending && { opacity: 0.6 },
          ]}
        >
          <Text style={mine ? styles.myText : styles.theirText}>{item.body}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#212529" />
        </Pressable>
        {photo ? (
          <Image source={{ uri: resizedImageUrl(photo, 100) }} style={styles.headerAvatar} />
        ) : null}
        <Text style={styles.headerName} numberOfLines={1}>
          {name}
        </Text>
        <Pressable
          onPress={() => setMenuVisible(true)}
          hitSlop={10}
          style={styles.headerButton}
          accessibilityLabel="More options"
        >
          <FontAwesome5 name="ellipsis-v" size={18} color="#495057" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#7B61FF" />
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              // Inverted lists render the empty component upside down
              <View style={[styles.emptyChat, { transform: [{ scaleY: -1 }] }]}>
                <Text style={styles.emptyTitle}>You matched with {name}!</Text>
                <Text style={styles.emptyText}>Say hi and break the ice.</Text>
              </View>
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            placeholderTextColor="#adb5bd"
            value={text}
            onChangeText={setText}
            maxLength={MAX_LENGTH}
            multiline
          />
          <Pressable
            style={[styles.sendButton, !text.trim() && { opacity: 0.4 }]}
            onPress={send}
            disabled={!text.trim()}
            accessibilityLabel="Send"
          >
            <FontAwesome5 name="paper-plane" solid size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <SafetyMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        targetUserId={otherUserId}
        targetName={name}
        matchId={matchId}
        onDone={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dee2e6",
  },
  headerButton: {
    padding: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 14,
    backgroundColor: "#e9ecef",
  },
  headerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 10,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
  },
  timestamp: {
    alignSelf: "center",
    fontSize: 12,
    color: "#adb5bd",
    marginVertical: 10,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    marginVertical: 2,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#7B61FF",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f3f5",
    borderBottomLeftRadius: 4,
  },
  myText: {
    color: "#fff",
    fontSize: 16,
  },
  theirText: {
    color: "#212529",
    fontSize: 16,
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  emptyText: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#dee2e6",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#7B61FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
