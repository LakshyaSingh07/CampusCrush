import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndValidateSession = async () => {
      setLoading(true);
      console.log("AuthProvider: Validating session with server...");

      // This call checks with the server if the user for the local session is still valid.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // We still get the session from local storage.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Only set the session in our app state if the user is confirmed to be valid by the server.
      // If the user was deleted, 'user' will be null, and therefore 'session' will be set to null.
      setSession(user ? session : null);
      console.log(
        "AuthProvider: Validation complete.",
        user ? "USER VALID" : "USER INVALID/DELETED"
      );
      setLoading(false);
    };

    fetchAndValidateSession();

    // The onAuthStateChange listener remains the same, it handles live changes like login/logout.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
