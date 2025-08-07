import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an active session when the provider mounts
    const fetchSession = async () => {
      console.log("AuthProvider: Attempting to fetch session from storage...");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log(
        "AuthProvider: Session fetched on startup:",
        session ? "SESSION FOUND" : "NO SESSION"
      );
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    // Listen for auth state changes (SIGNED_IN, SIGNED_OUT, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(
        `AuthProvider: Auth state changed! Event: ${_event}`,
        session ? "SESSION FOUND" : "NO SESSION"
      );
      setSession(session);
    });

    // Cleanup the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
