import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const fetchProfile = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error.message);
  }
  return data ?? null;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAndValidateSession = async () => {
      // getUser() checks with the server, so a deleted user isn't treated as
      // logged in just because a session is still cached locally.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const {
        data: { session: localSession },
      } = await supabase.auth.getSession();

      const currentSession = user ? localSession : null;
      const currentProfile = currentSession
        ? await fetchProfile(currentSession.user.id)
        : null;

      if (!isMounted) return;
      setSession(currentSession);
      setProfile(currentProfile);
      setLoading(false);
    };

    fetchAndValidateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // The initial session is handled by fetchAndValidateSession above.
      if (event === "INITIAL_SESSION") return;

      if (!newSession) {
        setSession(null);
        setProfile(null);
        return;
      }

      // Token refreshes don't change the user, so there's no need to refetch.
      if (event === "TOKEN_REFRESHED") {
        setSession(newSession);
        return;
      }

      // Don't await Supabase calls inside this callback (it can deadlock the
      // auth client). Set the session and profile together so route guards
      // never see a new session paired with a missing profile.
      setTimeout(async () => {
        const newProfile = await fetchProfile(newSession.user.id);
        if (!isMounted) return;
        setSession(newSession);
        setProfile(newProfile);
      }, 0);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Updates the profile in the database AND in the local state
  const updateProfile = async (updates) => {
    if (!session) return { error: new Error("Not signed in") };

    // Upsert so this still works if the new-user trigger didn't create a row
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ user_id: session.user.id, ...updates }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error.message);
      return { error };
    }

    setProfile(data);
    return { data };
  };

  const value = {
    session,
    profile,
    loading,
    user: session?.user,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
