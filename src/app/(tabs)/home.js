import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import MatchModal from "../../components/MatchModal";
import ProfileCard from "../../components/ProfileCard";
import ProfileDetails from "../../components/ProfileDetails";
import SafetyMenu from "../../components/SafetyMenu";
import SwipeableCard from "../../components/SwipeableCard";
import { useAuth } from "../../context/AuthProvider";
import { useEntitlements } from "../../context/EntitlementsProvider";
import { openChat } from "../../lib/navigation";
import { LIMIT_ERRORS } from "../../lib/premium";
import { supabase } from "../../lib/supabase";
import { makeStyles, useTheme } from "../../theme";
import { AppText, EmptyState, enter, IconButton, PressableScale, Screen, Skeleton } from "../../ui";

const PAGE_SIZE = 20;

function DeckSkeleton() {
  const styles = useStyles();
  return (
    <Animated.View entering={FadeIn} style={[styles.card, styles.skeletonCard]}>
      <View style={styles.skeletonInfo}>
        <Skeleton width={110} height={22} radius={11} />
        <Skeleton width="60%" height={30} style={{ marginTop: 12 }} />
        <Skeleton width="45%" height={16} style={{ marginTop: 10 }} />
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const { profile: myProfile } = useAuth();
  const { is_premium, swipesLeft, refresh: refreshEntitlements } = useEntitlements();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [match, setMatch] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [undoing, setUndoing] = useState(false);

  const topCardRef = useRef(null);
  // Profiles already swiped this session. A refetch can race with an
  // in-flight swipe, so filter them out of new pages.
  const swipedIds = useRef(new Set());
  // Horizontal drag of the top card, so the next card can scale up with it
  const dragX = useSharedValue(0);

  const openPaywall = (reason) => router.push({ pathname: "/premium", params: { reason } });

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.rpc("get_discovery_feed", { p_limit: PAGE_SIZE });
    if (error) setLoadError(error.message);
    else setCards(data.filter((p) => !swipedIds.current.has(p.user_id)));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Fetch the next page when the deck runs out
  useEffect(() => {
    if (!loading && !loadError && cards.length === 0 && swipedIds.current.size > 0) loadFeed();
    // Only react to the deck emptying
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  const removeTopCard = (userId) => {
    swipedIds.current.add(userId);
    setCards((prev) => prev.filter((c) => c.user_id !== userId));
  };

  const putCardBack = (profile) => {
    swipedIds.current.delete(profile.user_id);
    setCards((prev) => (prev.some((c) => c.user_id === profile.user_id) ? prev : [profile, ...prev]));
  };

  const handleSwipe = async (profile, direction) => {
    removeTopCard(profile.user_id);
    const { data, error } = await supabase.rpc("swipe", { p_target: profile.user_id, p_direction: direction });
    if (error) {
      // Free-tier limit: bring the card back and show the Premium screen
      const limit = LIMIT_ERRORS[error.message];
      if (limit) {
        putCardBack(profile);
        refreshEntitlements();
        openPaywall(limit);
      } else {
        Alert.alert("Error", error.message);
      }
      return;
    }
    refreshEntitlements();
    if (data?.[0]?.matched) setMatch({ profile, matchId: data[0].match_id });
  };

  // Buttons check the daily limit before animating; drags are checked by the server
  const swipeWithButton = (direction) => {
    if (swipesLeft === 0) return openPaywall("swipes");
    topCardRef.current?.swipe(direction);
  };

  const undo = async () => {
    if (!is_premium) return openPaywall("undo");
    if (undoing) return;
    setUndoing(true);
    const { data, error } = await supabase.rpc("undo_last_swipe");
    setUndoing(false);
    if (error) {
      const messages = {
        nothing_to_undo: "There's nothing to undo yet.",
        cannot_undo_match: "You matched with the last person you liked, so it can't be undone.",
      };
      Alert.alert("Can't undo", messages[error.message] ?? error.message);
      return;
    }
    if (data) putCardBack(data);
    refreshEntitlements();
  };

  const nextCardStyle = useAnimatedStyle(() => {
    const progress = interpolate(Math.abs(dragX.value), [0, width * 0.5], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [{ scale: 0.92 + progress * 0.08 }, { translateY: 14 - progress * 14 }],
      opacity: 0.7 + progress * 0.3,
    };
  });

  const [top, next] = cards;

  const renderDeck = () => {
    if (loading && cards.length === 0) return <DeckSkeleton />;
    if (loadError) {
      return (
        <EmptyState icon="wifi" title="Couldn't load profiles" text={loadError} actionTitle="Try again" onAction={loadFeed} />
      );
    }
    if (!top) {
      return (
        <EmptyState
          emoji="☕"
          title="You're all caught up"
          text="Check back later to see new people from campus."
          actionTitle="Refresh"
          onAction={loadFeed}
        >
          {swipedIds.current.size > 0 && (
            <PressableScale style={styles.undoLink} onPress={undo} disabled={undoing} haptic="light">
              <FontAwesome5 name="undo" size={13} color={t.colors.warning} />
              <AppText variant="bodyStrong" color="warning">
                Undo last swipe
              </AppText>
            </PressableScale>
          )}
        </EmptyState>
      );
    }
    return (
      <>
        {next && (
          <Animated.View key={next.user_id} style={[styles.card, nextCardStyle]}>
            <ProfileCard profile={next} style={{ flex: 1 }} />
          </Animated.View>
        )}
        <SwipeableCard
          key={top.user_id}
          ref={topCardRef}
          profile={top}
          dragX={dragX}
          style={styles.card}
          onSwipe={(direction) => handleSwipe(top, direction)}
          onMorePress={() => setMenuVisible(true)}
          onInfoPress={() => setDetailsVisible(true)}
        />
      </>
    );
  };

  const actionButtons = (onAction) => (
    <View style={styles.actions}>
      <IconButton
        icon="times"
        size={64}
        iconSize={26}
        color="pass"
        background="surface"
        elevated
        onPress={() => onAction("pass")}
        accessibilityLabel="Pass"
      />
      <IconButton
        icon="heart"
        size={72}
        iconSize={30}
        color="onPrimary"
        background="primary"
        elevated
        haptic="medium"
        onPress={() => onAction("like")}
        accessibilityLabel="Like"
      />
    </View>
  );

  return (
    <Screen edges={["top"]}>
      <View style={styles.header}>
        <AppText variant="h1" style={styles.logo}>
          campus<AppText variant="h1" color="primaryPressed">crush</AppText>
        </AppText>
        {is_premium ? (
          <View style={[styles.pill, styles.premiumPill]}>
            <FontAwesome5 name="crown" size={11} color={t.colors.onPrimary} />
            <AppText variant="caption" color="onPrimary">
              Premium
            </AppText>
          </View>
        ) : (
          swipesLeft !== null && (
            <PressableScale style={styles.pill} onPress={() => openPaywall("swipes")} haptic="light">
              <FontAwesome5 name="bolt" size={11} color={t.colors.primaryPressed} solid />
              <AppText variant="caption">
                {swipesLeft} {swipesLeft === 1 ? "swipe" : "swipes"} left
              </AppText>
            </PressableScale>
          )
        )}
      </View>

      {myProfile?.is_paused && (
        <Animated.View entering={enter(0)}>
          <PressableScale style={styles.pausedBanner} onPress={() => router.push("/(tabs)/profile")} scaleTo={0.98}>
            <FontAwesome5 name="pause-circle" size={16} color={t.colors.warning} solid />
            <AppText variant="caption" color="warning" style={{ flex: 1 }}>
              Your profile is paused, so nobody new can see you. Tap to change.
            </AppText>
          </PressableScale>
        </Animated.View>
      )}

      <View style={styles.deck}>{renderDeck()}</View>

      {top && (
        <Animated.View entering={enter(2)} style={styles.actionsRow}>
          <IconButton
            icon="undo"
            size={48}
            iconSize={17}
            color="warning"
            background="surface"
            elevated
            loading={undoing}
            onPress={undo}
            accessibilityLabel="Undo last swipe"
          />
          {actionButtons(swipeWithButton)}
          <View style={{ width: 48 }} />
        </Animated.View>
      )}

      <ProfileDetails
        profile={top}
        visible={detailsVisible && !!top}
        onClose={() => setDetailsVisible(false)}
        footer={actionButtons((direction) => {
          setDetailsVisible(false);
          swipeWithButton(direction);
        })}
      />

      {top && (
        <SafetyMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          targetUserId={top.user_id}
          targetName={top.first_name}
          onDone={() => removeTopCard(top.user_id)}
        />
      )}

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.md,
  },
  logo: {
    letterSpacing: -0.8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    ...t.shadow(2),
  },
  premiumPill: {
    backgroundColor: t.colors.primary,
  },
  pausedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.md,
    marginHorizontal: t.spacing.lg,
    marginBottom: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.warningSoft,
  },
  deck: {
    flex: 1,
    marginHorizontal: t.spacing.md,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
  },
  skeletonCard: {
    borderRadius: 28,
    backgroundColor: t.colors.skeleton,
    justifyContent: "flex-end",
  },
  skeletonInfo: {
    padding: 24,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: t.spacing.xxl,
    paddingVertical: t.spacing.lg,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: t.spacing.xxl,
    paddingVertical: t.spacing.sm,
  },
  undoLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: t.spacing.sm,
    marginTop: t.spacing.lg,
    padding: t.spacing.sm,
  },
}));
