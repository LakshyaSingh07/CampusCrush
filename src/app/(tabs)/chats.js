import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { useAuth } from "../../context/AuthProvider";
import { useEntitlements } from "../../context/EntitlementsProvider";
import { resizedImageUrl } from "../../lib/cloudinary";
import { formatTimeLeft, matchStatus, STATUS_LABELS } from "../../lib/matching";
import { openChat } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import { makeStyles, useTheme } from "../../theme";
import { AppText, EmptyState, enter, PressableScale, Screen, Skeleton } from "../../ui";

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

function NewMatch({ match, myId, index, onPress }) {
  const t = useTheme();
  const styles = useStyles();
  const status = matchStatus(match, myId);
  const myMove = status.kind === "your_move" || status.kind === "say_hi";

  return (
    <Animated.View entering={enter(index)}>
      <PressableScale style={styles.newMatch} onPress={onPress} haptic="light" scaleTo={0.92}>
        <LinearGradient
          colors={myMove ? t.gradients.sunset : [t.colors.border, t.colors.border]}
          style={styles.ring}
        >
          <Image source={{ uri: resizedImageUrl(match.photos?.[0], 200) }} style={styles.newMatchPhoto} />
        </LinearGradient>
        <AppText variant="bodyStrong" numberOfLines={1} style={{ marginTop: 6 }}>
          {match.first_name}
        </AppText>
        <AppText variant="small" color={myMove ? "primaryPressed" : "textMuted"} numberOfLines={1}>
          {STATUS_LABELS[status.kind]}
        </AppText>
        <AppText variant="small" color="textMuted">
          {formatTimeLeft(match.expires_at)}
        </AppText>
      </PressableScale>
    </Animated.View>
  );
}

function Conversation({ item, myId, index, onPress }) {
  const styles = useStyles();
  const unread = item.unread_count > 0;
  const fromMe = item.last_message_sender === myId;
  const status = matchStatus(item, myId);

  return (
    <Animated.View entering={enter(index)}>
      <PressableScale style={styles.row} onPress={onPress} haptic="light" scaleTo={0.98}>
        <Image source={{ uri: resizedImageUrl(item.photos?.[0], 120) }} style={styles.avatar} />
        <View style={styles.rowText}>
          <View style={styles.rowTop}>
            <AppText variant={unread ? "title" : "bodyStrong"}>{item.first_name}</AppText>
            <AppText variant="small" color={unread ? "primaryPressed" : "textMuted"}>
              {formatTime(item.last_message_at)}
            </AppText>
          </View>
          <AppText variant={unread ? "bodyStrong" : "body"} color={unread ? "text" : "textSecondary"} numberOfLines={1}>
            {fromMe ? "You: " : ""}
            {item.last_message}
          </AppText>
          {item.expires_at && (
            <View style={styles.expiry}>
              <FontAwesome5 name="hourglass-half" size={10} color={styles.expiryText.color} />
              <AppText variant="small" style={styles.expiryText}>
                {status.kind === "your_turn" ? "Your turn to reply" : "Waiting for a reply"} · {formatTimeLeft(item.expires_at)}
              </AppText>
            </View>
          )}
        </View>
        {unread && (
          <View style={styles.badge}>
            <AppText variant="small" color="onPrimary">
              {item.unread_count}
            </AppText>
          </View>
        )}
      </PressableScale>
    </Animated.View>
  );
}

export default function ChatsScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadMatches())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMatches]);

  const newMatches = matches.filter((m) => !m.last_message_at);
  const conversations = matches.filter((m) => m.last_message_at);

  const header = (
    <View>
      <View style={styles.header}>
        <AppText variant="h1">Chats</AppText>
        {match_limit != null && (
          <PressableScale
            style={styles.limit}
            onPress={() => router.push({ pathname: "/premium", params: { reason: "matches" } })}
            haptic="light"
          >
            <AppText variant="caption">
              {matches.length}/{match_limit} matches
            </AppText>
          </PressableScale>
        )}
      </View>

      {newMatches.length > 0 && (
        <View style={styles.section}>
          <AppText variant="label" color="textSecondary" style={styles.sectionTitle}>
            New matches · {newMatches.length}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {newMatches.map((m, i) => (
              <NewMatch key={m.match_id} match={m} myId={user?.id} index={i} onPress={() => openChat(router, m.match_id, toProfile(m))} />
            ))}
          </ScrollView>
        </View>
      )}

      {conversations.length > 0 && (
        <AppText variant="label" color="textSecondary" style={[styles.sectionTitle, { marginTop: 8 }]}>
          Messages
        </AppText>
      )}
    </View>
  );

  if (loading) {
    return (
      <Screen edges={["top"]}>
        {header}
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.row}>
            <Skeleton width={60} height={60} radius={30} />
            <View style={{ flex: 1, marginLeft: 14, gap: 8 }}>
              <Skeleton width="40%" height={16} />
              <Skeleton width="75%" height={14} />
            </View>
          </View>
        ))}
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.match_id}
        ListHeaderComponent={header}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={t.colors.primaryPressed}
            colors={[t.colors.primaryPressed]}
            onRefresh={() => {
              setRefreshing(true);
              loadMatches();
            }}
          />
        }
        ListEmptyComponent={
          newMatches.length === 0 ? (
            <EmptyState emoji="💬" title="No matches yet" text="When you and someone like each other, you'll be able to chat here." />
          ) : (
            <AppText color="textMuted" style={{ textAlign: "center", marginTop: 40 }}>
              Say hi to your new matches above 👆
            </AppText>
          )
        }
        renderItem={({ item, index }) => (
          <Conversation item={item} myId={user?.id} index={index} onPress={() => openChat(router, item.match_id, toProfile(item))} />
        )}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.lg,
  },
  limit: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    ...t.shadow(2),
  },
  section: {
    marginBottom: t.spacing.md,
  },
  sectionTitle: {
    paddingHorizontal: t.spacing.xl,
    marginBottom: t.spacing.md,
  },
  newMatch: {
    width: 88,
    alignItems: "center",
    marginHorizontal: 4,
  },
  ring: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
  },
  newMatchPhoto: {
    flex: 1,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: t.colors.bg,
    backgroundColor: t.colors.surfaceAlt,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: t.spacing.md,
    marginBottom: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: t.colors.surfaceAlt,
  },
  rowText: {
    flex: 1,
    marginLeft: 14,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  expiry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  expiryText: {
    color: t.colors.warning,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: t.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
}));
