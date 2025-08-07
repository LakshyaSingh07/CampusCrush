import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons"; // Or any other icon set you prefer

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007bff", // Color for the active tab
        tabBarInactiveTintColor: "gray", // Color for inactive tabs
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false, // We often don't need a header on the main swiping screen
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="fire" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="liked-you"
        options={{
          title: "Liked You",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="comments" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="comment" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
