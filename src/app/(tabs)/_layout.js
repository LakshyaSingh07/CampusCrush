import { FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7B61FF",
        tabBarInactiveTintColor: "#adb5bd",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="fire" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="liked-you"
        options={{
          title: "Liked You",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="heart" solid size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="comment" solid size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user" solid size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
