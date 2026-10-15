import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MatchModal from "../../components/MatchModal";
import ProfileCard from "../../components/ProfileCard";
import SafetyMenu from "../../components/SafetyMenu";
import SwipeableCard from "../../components/SwipeableCard";
import { useAuth } from "../../context/AuthProvider";
import { openChat } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";

const PAGE_SIZE = 20;

export default function HomeScreen() {
  const router = useRouter();
  const { profile: myProfile } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [match, setMatch] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const topCardRef = useRef(null);
  // Profiles already swiped this session. A refetch can race with an
  // in-flight swipe, so filter them out of new pages.
  const swipedIds = useRef(new Set());

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.rpc("get_discovery_feed", {
      p_limit: PAGE_SIZE,
    });
    if (error) {
      setLoadError(error.message);
    } else {
      setCards(data.filter((p) => !swipedIds.current.has(p.user_id)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Fetch the next page when the deck runs out
  useEffect(() => {
    if (!loading && !loadError && cards.length === 0 && swipedIds.current.size > 0) {
      loadFeed();
    }
    // Only react to the deck emptying
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  const removeTopCard = (userId) => {
    swipedIds.current.add(userId);
    setCards((prev) => prev.filter((c) => c.user_id !== userId));
  };

  const handleSwipe = async (profile, direction) => {
    removeTopCard(profile.user_id);
    const { data, error } = await supabase.rpc("swipe", {
      p_target: profile.user_id,
      p_direction: direction,
    });
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    if (data?.[0]?.matched) {
      setMatch({ profile, matchId: data[0].match_id });
    }
  };

  const [top, next] = cards;

  const renderDeck = () => {
    if (loading && cards.length === 0) {
      return <ActivityIndicator size="large" color="#7B61FF" />;
    }
    if (loadError) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Couldn&apos;t load profiles</Text>
          <Text style={styles.emptyText}>{loadError}</Text>
          <Pressable style={styles.refreshButton} onPress={loadFeed}>
            <Text style={styles.refreshText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    if (!top) {
      return (
        <View style={styles.empty}>
          <FontAwesome5 name="mug-hot" size={48} color="#adb5bd" />
          <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
          <Text style={styles.emptyText}>
            Check back later to see new people from campus.
          </Text>
          <Pressable style={styles.refreshButton} onPress={loadFeed}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <>
        {next && (
          <ProfileCard
            key={next.user_id}
            profile={next}
            style={[styles.card, styles.nextCard]}
          />
        )}
        <SwipeableCard
          key={top.user_id}
          ref={topCardRef}
          profile={top}
          style={styles.card}
          onSwipe={(direction) => handleSwipe(top, direction)}
          onMorePress={() => setMenuVisible(true)}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CampusCrush</Text>
      </View>

      {myProfile?.is_paused && (
        <Pressable style={styles.pausedBanner} onPress={() => router.push("/(tabs)/profile")}>
          <Text style={styles.pausedText}>
            Your profile is paused, so nobody new can see you. Tap to change.
          </Text>
        </Pressable>
      )}

      <View style={styles.deck}>{renderDeck()}</View>

      {top && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, styles.passButton]}
            onPress={() => topCardRef.current?.swipe("pass")}
            accessibilityLabel="Pass"
          >
            <FontAwesome5 name="times" size={28} color="#e03131" />
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => topCardRef.current?.swipe("like")}
            accessibilityLabel="Like"
          >
            <FontAwesome5 name="heart" solid size={28} color="#fff" />
          </Pressable>
        </View>
      )}

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
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 26,
    fontWeight: "800",
    color: "#7B61FF",
  },
  pausedBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff3bf",
  },
  pausedText: {
    color: "#5c3c00",
    fontSize: 13,
  },
  deck: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    ...StyleSheet.absoluteFillObject,
  },
  nextCard: {
    transform: [{ scale: 0.95 }],
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#6c757d",
    marginTop: 8,
    textAlign: "center",
  },
  refreshButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: "#7B61FF",
  },
  refreshText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    paddingVertical: 16,
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
  passButton: {
    backgroundColor: "#fff",
  },
  likeButton: {
    backgroundColor: "#7B61FF",
  },
});
