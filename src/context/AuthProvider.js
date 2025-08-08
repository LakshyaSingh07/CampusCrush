import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DEBUG: Log when the provider first mounts.
    console.log("--- AuthProvider Mounted: Starting initial auth check. ---");

    const fetchAndValidateSession = async () => {
      setLoading(true);

      // DEBUG: Log before checking the server.
      console.log("1. Validating session with Supabase server...");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // DEBUG: Log the result from the server check.
      console.log(
        "2. Server check complete. User object:",
        user
          ? `Exists (ID: ${user.id})`
          : "null (User deleted or not logged in)"
      );

      const {
        data: { session: localSession },
      } = await supabase.auth.getSession();

      const currentSession = user ? localSession : null;
      setSession(currentSession);

      if (currentSession) {
        // DEBUG: Log before fetching the user's profile.
        console.log("3. Session is valid, fetching profile from database...");
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentSession.user.id)
          .single();

        if (profileError) {
          console.error("DEBUG: Error fetching profile:", profileError.message);
        } else {
          // DEBUG: Log the profile data that was fetched.
          console.log(
            "4. Profile fetched:",
            userProfile ? `Name: ${userProfile.full_name}` : "No profile found."
          );
        }
        setProfile(userProfile);
      }

      // DEBUG: Log when the entire initial process is finished.
      console.log("5. Initial data fetch complete. App is ready.");
      setLoading(false);
    };

    fetchAndValidateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // DEBUG: Log any live authentication changes (login, logout, etc.).
      console.log(
        `--- Auth State Changed --- Event: ${_event}`,
        session ? "New session created." : "Session destroyed."
      );
      setSession(session);
      if (!session) {
        setProfile(null);
      } else {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        setProfile(userProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    profile,
    loading,
    user: session?.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
