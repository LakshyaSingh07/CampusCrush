import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

// Premium status, free-tier limits and badge counts from get_my_entitlements().
// The server enforces the limits; this is only for showing them.
const FREE_DEFAULTS = {
  unread_count: 0,
  new_match_count: 0,
  is_premium: false,
  premium_until: null,
  premium_plan: null,
  daily_swipe_limit: 20,
  swipes_today: 0,
  daily_superlike_limit: 1,
  superlikes_today: 0,
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

  // Keep the badge counts live: new messages, read receipts and new matches
  // (RLS limits the events to my own matches). Bursts are coalesced.
  const debounce = useRef(null);
  useEffect(() => {
    if (!ready) return;
    const refreshSoon = () => {
      clearTimeout(debounce.current);
      debounce.current = setTimeout(refresh, 400);
    };
    const channel = supabase
      .channel(`badges:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refreshSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, refreshSoon)
      .subscribe();
    return () => {
      clearTimeout(debounce.current);
      supabase.removeChannel(channel);
    };
  }, [ready, userId, refresh]);

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

  const superlikesLeft = Math.max(entitlements.daily_superlike_limit - entitlements.superlikes_today, 0);

  return (
    <EntitlementsContext.Provider value={{ ...entitlements, swipesLeft, superlikesLeft, refresh }}>
      {children}
    </EntitlementsContext.Provider>
  );
}
