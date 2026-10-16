import { useRouter } from "expo-router";
import { View } from "react-native";
import { unregisterPushToken } from "../lib/notifications";
import { supabase } from "../lib/supabase";
import { Button, EmptyState, Screen } from "../ui";

export default function SuspendedScreen() {
  const router = useRouter();

  const logout = async () => {
    await unregisterPushToken();
    supabase.auth.signOut();
  };

  return (
    <Screen>
      <EmptyState
        icon="user-slash"
        title="Your account has been suspended"
        text="Your account was suspended for breaking our Community Guidelines, so your profile is hidden and you can't swipe or send messages. If you think this is a mistake, contact the CampusCrush team."
      >
        <View style={{ marginTop: 28, gap: 12, alignSelf: "stretch" }}>
          <Button title="Read the Community Guidelines" variant="secondary" onPress={() => router.push("/legal/guidelines")} />
          <Button title="Log out" variant="dark" onPress={logout} />
        </View>
      </EmptyState>
    </Screen>
  );
}
