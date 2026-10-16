import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import MatchModal from "../../components/MatchModal";
import ProfileDetails from "../../components/ProfileDetails";
import SafetyMenu from "../../components/SafetyMenu";
import { useAuth } from "../../context/AuthProvider";
import { useEntitlements } from "../../context/EntitlementsProvider";
import { resizedImageUrl } from "../../lib/cloudinary";
import { openChat } from "../../lib/navigation";
import { LIMIT_ERRORS } from "../../lib/premium";
import { supabase } from "../../lib/supabase";
import { makeStyles, useTheme } from "../../theme";
import { AppText, Button, EmptyState, enter, IconButton, PressableScale, Screen, Skeleton } from "../../ui";

// Free users only get the count, never the profiles, so there's nothing to
// "un-blur". These tiles are placeholders.
const LOCKED_TILES = [
  ["#FFE08A", "#FFB88C"],
  ["#FFD3B6", "#FFE08A"],
  ["#FFC2A8", "#FFE5A3"],
  ["#FFE9B0", "#FFC8A2"],
];

export default function LikedYouScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
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

  const removeLike = (userId) => setLikes((prev) => prev.filter((p) => p.user_id !== userId));

  const respond = async (direction) => {
    if (!selected || swiping) return;
    setSwiping(true);
    const { data, error } = await supabase.rpc("swipe", { p_target: selected.user_id, p_direction: direction });
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
    if (data?.[0]?.matched) setMatch({ profile: person, matchId: data[0].match_id });
  };

  const header = (
    <Animated.View entering={enter(0)} style={styles.header}>
      <AppText variant="h1">Liked You</AppText>
      <AppText color="textSecondary" style={{ marginTop: 4 }}>
        {liked_me_count > 0
          ? `${liked_me_count} ${liked_me_count === 1 ? "person likes" : "people like"} you.${is_premium ? " Like them back to match." : ""}`
          : "People who like you will show up here."}
      </AppText>
    </Animated.View>
  );

  if (loading) {
    return (
      <Screen edges={["top"]}>
        {header}
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="48%" height={220} radius={20} />
          ))}
        </View>
      </Screen>
    );
  }

  if (!is_premium) {
    return (
      <Screen edges={["top"]}>
        {header}
        {liked_me_count > 0 ? (
          <View style={styles.lockedWrap}>
            <View style={styles.lockedGrid}>
              {Array.from({ length: Math.min(liked_me_count, 4) }, (_, i) => (
                <Animated.View key={i} entering={enter(i + 1)} style={styles.tileWrap}>
                  <LinearGradient colors={LOCKED_TILES[i % LOCKED_TILES.length]} style={styles.lockedTile}>
                    <View style={styles.lockCircle}>
                      <FontAwesome5 name="lock" size={18} color="#1E1A12" />
                    </View>
                  </LinearGradient>
                </Animated.View>
              ))}
            </View>
            <Animated.View entering={enter(6)} style={{ alignSelf: "stretch", marginTop: 24 }}>
              <Button title="See who likes you" icon="crown" onPress={() => openPaywall("likes")} haptic="medium" />
              <AppText variant="caption" color="textSecondary" style={styles.lockedHint}>
                Or keep swiping on Discover. If you like them too, it&apos;s a match.
              </AppText>
            </Animated.View>
          </View>
        ) : (
          <EmptyState emoji="💛" title="No likes yet" text="Keep swiping on Discover. Likes show up here the moment they happen." />
        )}
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <FlatList
        data={likes}
        keyExtractor={(item) => item.user_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={t.colors.primaryPressed}
            colors={[t.colors.primaryPressed]}
            onRefresh={() => {
              setRefreshing(true);
              loadLikes();
            }}
          />
        }
        ListEmptyComponent={
          <EmptyState emoji="💛" title="No likes yet" text="Keep swiping on Discover. Likes show up here the moment they happen." />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={enter(index)} style={styles.tileWrap}>
            <PressableScale style={styles.tile} onPress={() => setSelected(item)} haptic="light" scaleTo={0.96}>
              <Image source={{ uri: resizedImageUrl(item.photos?.[0], 400) }} style={{ flex: 1 }} contentFit="cover" transition={200} />
              <LinearGradient colors={t.gradients.photoFade} style={styles.tileInfo}>
                <AppText variant="title" color="#FFFFFF">
                  {item.first_name}, {item.age}
                </AppText>
                <AppText variant="small" color="rgba(255,255,255,0.85)" numberOfLines={1}>
                  {item.department}
                </AppText>
              </LinearGradient>
            </PressableScale>
          </Animated.View>
        )}
      />

      <ProfileDetails
        profile={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
        footer={
          selected && (
            <View style={styles.actions}>
              <IconButton icon="ellipsis-h" size={48} iconSize={17} background="surface" elevated onPress={() => setMenuVisible(true)} accessibilityLabel="More options" />
              <IconButton icon="times" size={64} iconSize={26} color="pass" background="surface" elevated onPress={() => respond("pass")} disabled={swiping} accessibilityLabel="Pass" />
              <IconButton
                icon="heart"
                size={72}
                iconSize={30}
                color="onPrimary"
                background="primary"
                elevated
                haptic="medium"
                loading={swiping}
                onPress={() => respond("like")}
                accessibilityLabel="Like back"
              />
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
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: {
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.lg,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: t.spacing.md,
    paddingHorizontal: t.spacing.md,
  },
  lockedWrap: {
    paddingHorizontal: t.spacing.md,
    alignItems: "center",
  },
  lockedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    rowGap: t.spacing.md,
  },
  tileWrap: {
    width: "48.5%",
  },
  lockedTile: {
    aspectRatio: 3 / 4,
    borderRadius: t.radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  lockCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockedHint: {
    textAlign: "center",
    marginTop: t.spacing.md,
  },
  list: {
    paddingHorizontal: t.spacing.md,
    paddingBottom: t.spacing.xxl,
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: t.spacing.md,
  },
  tile: {
    aspectRatio: 3 / 4,
    borderRadius: t.radius.lg,
    overflow: "hidden",
    backgroundColor: t.colors.surfaceAlt,
  },
  tileInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: t.spacing.md,
    paddingTop: 36,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: t.spacing.xxl,
    paddingVertical: t.spacing.sm,
  },
}));
