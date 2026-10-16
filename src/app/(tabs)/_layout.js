import { Tabs } from "expo-router";
import TabBar from "../../components/TabBar";
import { useTheme } from "../../theme";

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "shift",
        sceneStyle: { backgroundColor: t.colors.bg },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Discover" }} />
      <Tabs.Screen name="liked-you" options={{ title: "Liked You" }} />
      <Tabs.Screen name="chats" options={{ title: "Chats" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
