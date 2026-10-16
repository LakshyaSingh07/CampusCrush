import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import ProfileDetails from "../../components/ProfileDetails";
import SafetyMenu from "../../components/SafetyMenu";
import TypingDots from "../../components/TypingDots";
import { useAuth } from "../../context/AuthProvider";
import { resizedImageUrl } from "../../lib/cloudinary";
import { formatTimeLeft, matchStatus } from "../../lib/matching";
import { setActiveChat } from "../../lib/notifications";
import { supabase } from "../../lib/supabase";
import { makeStyles, useTheme } from "../../theme";
import { AppText, haptics, IconButton, PressableScale, Screen, Skeleton } from "../../ui";

const PAGE_SIZE = 100;
const MAX_LENGTH = 2000;
const MESSAGE_FIELDS = "id, sender_id, body, created_at, read_at";
const TYPING_TIMEOUT_MS = 3500;

export default function ChatScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const { user } = useAuth();
  const { matchId, name, photo, otherUserId } = useLocalSearchParams();

  // Newest first, rendered with an inverted list
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  // This match's row from get_my_matches: the other person's profile plus
  // first-move/expiry state. null once the match has ended or expired.
  const [match, setMatch] = useState(undefined);

  const channelRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);

  const markRead = useCallback(() => {
    supabase.rpc("mark_match_read", { p_match_id: matchId });
  }, [matchId]);

  const loadMatch = useCallback(async () => {
    const { data } = await supabase.rpc("get_my_matches");
    setMatch(data?.find((m) => m.match_id === matchId) ?? null);
  }, [matchId]);

  useEffect(() => {
    let isMounted = true;
    setActiveChat(matchId);

    const load = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(MESSAGE_FIELDS)
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
    loadMatch();

    const channel = supabase
      .channel(`chat:${matchId}`)
      // Their new messages (ours come from the insert response)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        ({ new: message }) => {
          if (message.sender_id === user?.id) return;
          setOtherTyping(false);
          setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [message, ...prev]));
          haptics.light();
          markRead();
          // Their first message unlocks replying and changes the expiry
          loadMatch();
        }
      )
      // Read receipts: read_at is set when they open the chat
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        ({ new: message }) => {
          setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, read_at: message.read_at } : m)));
        }
      )
      // Typing indicator (ephemeral, never stored)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.user_id === user?.id) return;
        setOtherTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setOtherTyping(false), TYPING_TIMEOUT_MS);
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      isMounted = false;
      setActiveChat(null);
      clearTimeout(typingTimer.current);
      supabase.removeChannel(channel);
    };
  }, [matchId, user?.id, markRead, loadMatch]);

  const onChangeText = (value) => {
    setText(value);
    // Tell the other person we're typing, at most every 2 seconds
    const now = Date.now();
    if (value && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      channelRef.current?.send({ type: "broadcast", event: "typing", payload: { user_id: user?.id } });
    }
  };

  const status = match ? matchStatus(match, user?.id) : null;
  const timeLeft = formatTimeLeft(match?.expires_at);
  const banner =
    match === null
      ? "This match has ended."
      : status?.kind === "their_move"
        ? `On CampusCrush, women make the first move. ${name} has ${timeLeft} to say hi.`
        : status?.kind === "your_move"
          ? `You make the first move! ${timeLeft} before this match expires.`
          : status?.kind === "say_hi"
            ? `Say hi! ${timeLeft} before this match expires.`
            : status?.kind === "your_turn"
              ? `Your turn to reply: ${timeLeft} before this match expires.`
              : null;
  const canSend = match !== null && (status?.canSend ?? true);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    haptics.light();

    // Show the message straight away, then swap in the saved row
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      { id: tempId, sender_id: user.id, body, created_at: new Date().toISOString(), pending: true },
      ...prev,
    ]);

    const { data, error } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: user.id, body })
      .select(MESSAGE_FIELDS)
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(body);
      haptics.warning();
      // RLS rejects inserts once the match has ended (unmatch or block)
      Alert.alert("Message not sent", error.code === "42501" ? "This conversation is no longer available." : error.message);
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
    loadMatch();
  };

  // "Seen" goes under my most recent message, once it's been read
  const lastMineId = messages.find((m) => m.sender_id === user?.id)?.id;

  const renderMessage = ({ item, index }) => {
    const mine = item.sender_id === user?.id;
    // The list is inverted, so the visually previous message is index + 1
    const older = messages[index + 1];
    const newer = messages[index - 1];
    const showTime = !older || new Date(item.created_at) - new Date(older.created_at) > 15 * 60000;
    const groupedWithNewer = newer && newer.sender_id === item.sender_id;

    return (
      <Animated.View entering={index === 0 ? FadeInDown.springify().damping(16) : undefined}>
        {showTime && (
          <AppText variant="small" color="textMuted" style={styles.timestamp}>
            {new Date(item.created_at).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}
          </AppText>
        )}
        <View
          style={[
            styles.bubble,
            mine ? styles.myBubble : styles.theirBubble,
            groupedWithNewer && (mine ? styles.myGrouped : styles.theirGrouped),
            item.pending && { opacity: 0.6 },
          ]}
        >
          <AppText color={mine ? "onPrimary" : "text"}>{item.body}</AppText>
        </View>
        {mine && item.id === lastMineId && !item.pending && (
          <AppText variant="small" color="textMuted" style={styles.receipt}>
            {item.read_at ? "Seen" : "Delivered"}
          </AppText>
        )}
      </Animated.View>
    );
  };

  return (
    <Screen keyboard>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={40} background="surfaceAlt" onPress={() => router.back()} accessibilityLabel="Back" />
        <PressableScale
          style={styles.headerProfile}
          onPress={() => match && setProfileVisible(true)}
          scaleTo={0.97}
          accessibilityLabel={`View ${name}'s profile`}
        >
          {photo ? <Image source={{ uri: resizedImageUrl(photo, 100) }} style={styles.headerAvatar} /> : null}
          <View style={{ flex: 1 }}>
            <AppText variant="title" numberOfLines={1}>
              {name}
            </AppText>
            {otherTyping ? (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <AppText variant="small" color="primaryPressed">
                  typing…
                </AppText>
              </Animated.View>
            ) : (
              <AppText variant="small" color="textMuted">
                View profile
              </AppText>
            )}
          </View>
        </PressableScale>
        <IconButton icon="ellipsis-v" size={40} background="surfaceAlt" onPress={() => setMenuVisible(true)} accessibilityLabel="More options" />
      </View>

      {loading ? (
        <View style={{ flex: 1, padding: 16, justifyContent: "flex-end", gap: 10 }}>
          <Skeleton width="55%" height={40} radius={20} />
          <Skeleton width="40%" height={40} radius={20} style={{ alignSelf: "flex-end" }} />
          <Skeleton width="65%" height={40} radius={20} />
        </View>
      ) : (
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          ListHeaderComponent={otherTyping ? <TypingDots /> : null}
          ListEmptyComponent={
            // Inverted lists render the empty component upside down
            <View style={[styles.emptyChat, { transform: [{ scaleY: -1 }] }]}>
              {photo ? <Image source={{ uri: resizedImageUrl(photo, 200) }} style={styles.emptyAvatar} /> : null}
              <AppText variant="h2" style={{ textAlign: "center" }}>
                You matched with {name}!
              </AppText>
              <AppText color="textSecondary" style={{ textAlign: "center", marginTop: 4 }}>
                {status?.kind === "their_move" ? `Waiting for ${name} to say hi.` : "Say hi and break the ice."}
              </AppText>
            </View>
          }
        />
      )}

      {banner && (
        <Animated.View entering={FadeIn} style={styles.banner}>
          <FontAwesome5 name="hourglass-half" size={13} color={t.colors.warning} />
          <AppText variant="caption" color="warning" style={{ flex: 1 }}>
            {banner}
          </AppText>
        </Animated.View>
      )}

      {canSend && (
        <View style={styles.composer}>
          <TextInput
            style={[t.typography.body, styles.input]}
            placeholder="Type a message"
            placeholderTextColor={t.colors.textMuted}
            selectionColor={t.colors.primary}
            value={text}
            onChangeText={onChangeText}
            maxLength={MAX_LENGTH}
            multiline
          />
          <IconButton
            icon="paper-plane"
            size={46}
            iconSize={17}
            color="onPrimary"
            background="primary"
            onPress={send}
            disabled={!text.trim()}
            style={!text.trim() && { opacity: 0.4 }}
            accessibilityLabel="Send"
          />
        </View>
      )}

      <ProfileDetails profile={match} visible={profileVisible && !!match} onClose={() => setProfileVisible(false)} />

      <SafetyMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        targetUserId={otherUserId}
        targetName={name}
        matchId={matchId}
        onDone={() => router.back()}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: t.colors.surfaceAlt,
  },
  list: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.md,
    flexGrow: 1,
  },
  timestamp: {
    alignSelf: "center",
    marginVertical: t.spacing.md,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 22,
    marginVertical: 2,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: t.colors.primary,
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: t.colors.surface,
    borderBottomLeftRadius: 6,
  },
  myGrouped: {
    borderBottomRightRadius: 22,
    borderTopRightRadius: 8,
  },
  theirGrouped: {
    borderBottomLeftRadius: 22,
    borderTopLeftRadius: 8,
  },
  receipt: {
    alignSelf: "flex-end",
    marginTop: 2,
    marginRight: 4,
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: t.spacing.xxxl,
  },
  emptyAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: t.spacing.lg,
    borderWidth: 3,
    borderColor: t.colors.primary,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    backgroundColor: t.colors.warningSoft,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.bg,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    color: t.colors.text,
    backgroundColor: t.colors.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
}));
