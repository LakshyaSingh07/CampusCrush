import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MatchModal from "../../components/MatchModal";
import ProfileCard from "../../components/ProfileCard";
import SafetyMenu from "../../components/SafetyMenu";
import { useAuth } from "../../context/AuthProvider";
import { resizedImageUrl } from "../../lib/cloudinary";
import { openChat } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";

export default function LikedYouScreen() {
  const router = useRouter();
  const { profile: myProfile } = useAuth();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [match, setMatch] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const loadLikes = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_liked_me");
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setLikes(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

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
      Alert.alert("Error", error.message);
      return;
    }
    const person = selected;
    removeLike(person.user_id);
    setSelected(null);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Liked You</Text>
        <Text style={styles.subtitle}>
          {likes.length > 0
            ? `${likes.length} ${likes.length === 1 ? "person likes" : "people like"} you. Like them back to match.`
            : "People who like you will show up here."}
        </Text>
      </View>

      <FlatList
        data={likes}
        keyExtractor={(item) => item.user_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadLikes();
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome5 name="heart" size={48} color="#dee2e6" />
            <Text style={styles.emptyText}>
              No likes yet. Keep swiping on Discover!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.tile} onPress={() => setSelected(item)}>
            <Image
              source={{ uri: resizedImageUrl(item.photos?.[0], 400) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.75)"]}
              style={styles.tileInfo}
            >
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

      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <SafeAreaView style={styles.detail}>
            <Pressable style={styles.closeButton} onPress={() => setSelected(null)}>
              <FontAwesome5 name="chevron-down" size={22} color="#212529" />
            </Pressable>
            <ProfileCard
              profile={selected}
              style={styles.detailCard}
              onMorePress={() => setMenuVisible(true)}
            />
            <View style={styles.actions}>
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
            </View>

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
          </SafeAreaView>
        )}
      </Modal>

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
  detail: {
    flex: 1,
    backgroundColor: "#fff",
  },
  closeButton: {
    alignSelf: "center",
    padding: 12,
    marginTop: 40,
  },
  detailCard: {
    flex: 1,
    marginHorizontal: 12,
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
