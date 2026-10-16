import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthProvider";
import { useEntitlements } from "../../context/EntitlementsProvider";
import { resizedImageUrl } from "../../lib/cloudinary";
import { formatTimeLeft, matchStatus, STATUS_LABELS } from "../../lib/matching";
import { openChat } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";

// get_my_matches rows are profile cards plus match fields
const toProfile = (m) => ({ ...m, user_id: m.other_user_id });

const formatTime = (iso) => {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const days = Math.floor((now - date) / 86400000);
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
};

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { match_limit, refresh: refreshEntitlements } = useEntitlements();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_my_matches");
    if (!error) setMatches(data);
    setLoading(false);
    setRefreshing(false);
    refreshEntitlements();
  }, [refreshEntitlements]);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  // Any new message in one of my matches (RLS limits what we receive)
  // refreshes the list so previews and unread counts stay current.
  useEffect(() => {
    const channel = supabase
      .channel("chats-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => loadMatches()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMatches]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7B61FF" />
      </View>
    );
  }

  const newMatches = matches.filter((m) => !m.last_message_at);
  const conversations = matches.filter((m) => m.last_message_at);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        {match_limit != null && (
          <Pressable onPress={() => router.push({ pathname: "/premium", params: { reason: "matches" } })}>
            <Text style={styles.limit}>
              {matches.length}/{match_limit} active matches
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.match_id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadMatches();
        }}
        contentContainerStyle={{ flexGrow: 1 }}
        ListHeaderComponent={
          newMatches.length > 0 ? (
            <View style={styles.newMatches}>
              <Text style={styles.sectionTitle}>New matches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {newMatches.map((m) => {
                  const status = matchStatus(m, user?.id);
                  const myMove = status.kind === "your_move" || status.kind === "say_hi";
                  return (
                    <Pressable
                      key={m.match_id}
                      style={styles.newMatch}
                      onPress={() => openChat(router, m.match_id, toProfile(m))}
                    >
                      <Image
                        source={{ uri: resizedImageUrl(m.photos?.[0], 200) }}
                        style={[styles.newMatchPhoto, myMove && styles.myMoveRing]}
                      />
                      <Text style={styles.newMatchName} numberOfLines={1}>
                        {m.first_name}
                      </Text>
                      <Text style={[styles.moveLabel, myMove && styles.myMoveLabel]} numberOfLines={1}>
                        {STATUS_LABELS[status.kind]}
                      </Text>
                      <Text style={styles.timeLeft}>{formatTimeLeft(m.expires_at)}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {conversations.length > 0 && (
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                  Messages
                </Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          newMatches.length === 0 ? (
            <View style={styles.empty}>
              <FontAwesome5 name="comments" size={48} color="#dee2e6" />
              <Text style={styles.emptyText}>
                No matches yet. When you and someone like each other,
                you&apos;ll be able to chat here.
              </Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              Say hi to your new matches above!
            </Text>
          )
        }
        renderItem={({ item }) => {
          const unread = item.unread_count > 0;
          const fromMe = item.last_message_sender === user?.id;
          return (
            <Pressable
              style={styles.row}
              onPress={() => openChat(router, item.match_id, toProfile(item))}
            >
              <Image
                source={{ uri: resizedImageUrl(item.photos?.[0], 120) }}
                style={styles.avatar}
              />
              <View style={styles.rowText}>
                <View style={styles.rowTop}>
                  <Text style={[styles.name, unread && styles.bold]}>
                    {item.first_name}
                  </Text>
                  <Text style={styles.time}>{formatTime(item.last_message_at)}</Text>
                </View>
                <Text
                  style={[styles.preview, unread && styles.previewUnread]}
                  numberOfLines={1}
                >
                  {fromMe ? "You: " : ""}
                  {item.last_message}
                </Text>
                {item.expires_at && (
                  <Text style={styles.expiry}>
                    {matchStatus(item, user?.id).kind === "your_turn"
                      ? "Your turn to reply"
                      : "Waiting for a reply"}{" "}
                    · {formatTimeLeft(item.expires_at)}
                  </Text>
                )}
              </View>
              {unread && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread_count}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  limit: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5f3dc4",
    backgroundColor: "#f3f0ff",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  myMoveRing: {
    borderWidth: 3,
    borderColor: "#7B61FF",
  },
  moveLabel: {
    fontSize: 11,
    color: "#868e96",
    marginTop: 2,
  },
  myMoveLabel: {
    color: "#7B61FF",
    fontWeight: "700",
  },
  timeLeft: {
    fontSize: 11,
    color: "#adb5bd",
  },
  expiry: {
    fontSize: 12,
    color: "#e8590c",
    marginTop: 2,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7B61FF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  newMatches: {
    paddingBottom: 8,
  },
  newMatch: {
    width: 80,
    marginLeft: 16,
    alignItems: "center",
  },
  newMatchPhoto: {
    width: 72,
    height: 96,
    borderRadius: 12,
    backgroundColor: "#e9ecef",
  },
  newMatchName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212529",
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e9ecef",
  },
  rowText: {
    flex: 1,
    marginLeft: 14,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
  },
  bold: {
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    color: "#adb5bd",
  },
  preview: {
    fontSize: 14,
    color: "#868e96",
    marginTop: 2,
  },
  previewUnread: {
    color: "#212529",
    fontWeight: "600",
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#7B61FF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    color: "#6c757d",
    marginTop: 16,
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
    marginTop: 40,
  },
});
