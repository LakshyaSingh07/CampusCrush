import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MatchModal from "../../components/MatchModal";
import ProfileDetails from "../../components/ProfileDetails";
import SafetyMenu from "../../components/SafetyMenu";
import { useAuth } from "../../context/AuthProvider";
import { useEntitlements } from "../../context/EntitlementsProvider";
import { resizedImageUrl } from "../../lib/cloudinary";
import { openChat } from "../../lib/navigation";
import { LIMIT_ERRORS } from "../../lib/premium";
import { supabase } from "../../lib/supabase";

// Free users only get the count, never the profiles, so there's nothing to
// "un-blur". These tiles are placeholders.
const LOCKED_TILE_COLORS = [
  ["#d0bfff", "#faa2c1"],
  ["#a5d8ff", "#d0bfff"],
  ["#ffc9c9", "#ffd8a8"],
  ["#c3fae8", "#a5d8ff"],
];

export default function LikedYouScreen() {
  const router = useRouter();
  const { profile: myProfile } = useAuth();
  const { is_premium, liked_me_count, refresh: refreshEntitlements } = useEntitlements();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [match, setMatch] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const openPaywall = (reason) => router.push({ pathname: "/premium", params: { reason } });

  const loadLikes = useCallback(async () => {
    refreshEntitlements();
    if (!is_premium) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const { data, error } = await supabase.rpc("get_liked_me");
    if (!error) setLikes(data);
    else if (error.message !== "premium_required") Alert.alert("Error", error.message);
    setLoading(false);
    setRefreshing(false);
  }, [is_premium, refreshEntitlements]);

  // Refresh every time the tab is opened
  useFocusEffect(
    useCallback(() => {
      loadLikes();
    }, [loadLikes])
  );

  const removeLike = (userId) =>
    setLikes((prev) => prev.filter((p) => p.user_id !== userId));

  const respond = async (direction) => {
    if (!selected || swiping) return;
    setSwiping(true);
    const { data, error } = await supabase.rpc("swipe", {
      p_target: selected.user_id,
      p_direction: direction,
    });
    setSwiping(false);
    if (error) {
      const limit = LIMIT_ERRORS[error.message];
      if (limit) {
        setSelected(null);
        openPaywall(limit);
      } else {
        Alert.alert("Error", error.message);
      }
      return;
    }
    const person = selected;
    removeLike(person.user_id);
    setSelected(null);
    refreshEntitlements();
    if (data?.[0]?.matched) {
      setMatch({ profile: person, matchId: data[0].match_id });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7B61FF" />
      </View>
    );
  }

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Liked You</Text>
      <Text style={styles.subtitle}>
        {liked_me_count > 0
          ? `${liked_me_count} ${liked_me_count === 1 ? "person likes" : "people like"} you.${is_premium ? " Like them back to match." : ""}`
          : "People who like you will show up here."}
      </Text>
    </View>
  );

  if (!is_premium) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        {liked_me_count > 0 ? (
          <View style={styles.lockedWrap}>
            <View style={styles.lockedGrid}>
              {Array.from({ length: Math.min(liked_me_count, 4) }, (_, i) => (
                <LinearGradient
                  key={i}
                  colors={LOCKED_TILE_COLORS[i % LOCKED_TILE_COLORS.length]}
                  style={styles.lockedTile}
                >
                  <FontAwesome5 name="lock" size={22} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
              ))}
            </View>
            <Pressable style={styles.unlockButton} onPress={() => openPaywall("likes")}>
              <FontAwesome5 name="crown" size={16} color="#ffd43b" />
              <Text style={styles.unlockText}>See who likes you</Text>
            </Pressable>
            <Text style={styles.lockedHint}>
              Or keep swiping on Discover. If you like them too, it&apos;s a match.
            </Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <FontAwesome5 name="heart" size={48} color="#dee2e6" />
            <Text style={styles.emptyText}>No likes yet. Keep swiping on Discover!</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={likes}
        keyExtractor={(item) => item.user_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadLikes();
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome5 name="heart" size={48} color="#dee2e6" />
            <Text style={styles.emptyText}>No likes yet. Keep swiping on Discover!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.tile} onPress={() => setSelected(item)}>
            <Image
              source={{ uri: resizedImageUrl(item.photos?.[0], 400) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.tileInfo}>
              <Text style={styles.tileName}>
                {item.first_name}, {item.age}
              </Text>
              <Text style={styles.tileDept} numberOfLines={1}>
                {item.department}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      />

      <ProfileDetails
        profile={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
        footer={
          selected && (
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, styles.smallButton]}
                onPress={() => setMenuVisible(true)}
                accessibilityLabel="More options"
              >
                <FontAwesome5 name="ellipsis-h" size={18} color="#495057" />
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.passButton]}
                onPress={() => respond("pass")}
                disabled={swiping}
                accessibilityLabel="Pass"
              >
                <FontAwesome5 name="times" size={28} color="#e03131" />
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.likeButton]}
                onPress={() => respond("like")}
                disabled={swiping}
                accessibilityLabel="Like back"
              >
                {swiping ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <FontAwesome5 name="heart" solid size={28} color="#fff" />
                )}
              </Pressable>
              <SafetyMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                targetUserId={selected.user_id}
                targetName={selected.first_name}
                onDone={() => {
                  removeLike(selected.user_id);
                  setSelected(null);
                }}
              />
            </View>
          )
        }
      />

      <MatchModal
        match={match}
        myGender={myProfile?.gender}
        myPhoto={myProfile?.profile_image_urls?.[0]}
        onClose={() => setMatch(null)}
        onMessage={() => {
          const { matchId, profile } = match;
          setMatch(null);
          openChat(router, matchId, profile);
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  lockedWrap: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  lockedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    rowGap: 12,
  },
  lockedTile: {
    width: "48.5%",
    aspectRatio: 3 / 4,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#7B61FF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 24,
  },
  unlockText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  lockedHint: {
    fontSize: 13,
    color: "#868e96",
    textAlign: "center",
    marginTop: 12,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tile: {
    // Fixed width so a lone tile in the last row doesn't stretch
    width: "48.5%",
    aspectRatio: 3 / 4,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#e9ecef",
  },
  tileInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    paddingTop: 30,
  },
  tileName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  tileDept: {
    color: "#f1f3f5",
    fontSize: 12,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: "#6c757d",
    marginTop: 16,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  smallButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
  },
  passButton: {
    backgroundColor: "#fff",
  },
  likeButton: {
    backgroundColor: "#7B61FF",
  },
});
