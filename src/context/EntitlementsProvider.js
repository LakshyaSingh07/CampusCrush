import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

// Premium status and free-tier limits from get_my_entitlements(). The server
// enforces the limits; this is only for showing them.
const FREE_DEFAULTS = {
  is_premium: false,
  premium_until: null,
  premium_plan: null,
  daily_swipe_limit: 20,
  swipes_today: 0,
  active_matches: 0,
  match_limit: 5,
  liked_me_count: 0,
};

const EntitlementsContext = createContext({ ...FREE_DEFAULTS, refresh: () => {} });

export const useEntitlements = () => useContext(EntitlementsContext);

export function EntitlementsProvider({ children }) {
  const { session, profile } = useAuth();
  const [entitlements, setEntitlements] = useState(FREE_DEFAULTS);
  const userId = session?.user?.id;
  const ready = !!userId && !!profile?.onboarding_done;

  const refresh = useCallback(async () => {
    if (!ready) {
      setEntitlements(FREE_DEFAULTS);
      return;
    }
    const { data, error } = await supabase.rpc("get_my_entitlements");
    if (!error && data) setEntitlements({ ...FREE_DEFAULTS, ...data });
  }, [ready]);

  useEffect(() => {
    refresh();
  }, [refresh, userId]);

  // Premium can expire, and swipe counts reset at midnight, while the app
  // sits in the background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const swipesLeft =
    entitlements.daily_swipe_limit == null
      ? null
      : Math.max(entitlements.daily_swipe_limit - entitlements.swipes_today, 0);

  return (
    <EntitlementsContext.Provider value={{ ...entitlements, swipesLeft, refresh }}>
      {children}
    </EntitlementsContext.Provider>
  );
}
