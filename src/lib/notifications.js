import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// The chat currently on screen, so we don't show a banner for messages the
// user is already reading.
let activeMatchId = null;
export const setActiveChat = (matchId) => {
  activeMatchId = matchId;
};

let registeredToken = null;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data ?? {};
    const isOpenChat = data.type === "message" && data.match_id === activeMatchId;
    return {
      shouldShowBanner: !isOpenChat,
      shouldShowList: !isOpenChat,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

// Asks for permission (once) and saves this device's Expo push token for the
// signed-in user. Safe to call on every launch. Returns the token or null.
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) return null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Matches and messages",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn("Push notifications disabled: run `eas init` to set an EAS projectId.");
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc("register_push_token", {
      p_token: token,
      p_platform: Platform.OS,
    });
    if (error) throw error;

    registeredToken = token;
    return token;
  } catch (e) {
    // e.g. Expo Go on Android, which doesn't support remote notifications
    console.warn("Push notification registration failed:", e.message);
    return null;
  }
};

// Call before signing out so this device stops getting the user's notifications
export const unregisterPushToken = async () => {
  if (!registeredToken) return;
  await supabase.rpc("unregister_push_token", { p_token: registeredToken });
  registeredToken = null;
};
