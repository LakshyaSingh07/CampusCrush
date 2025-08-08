// import { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../lib/supabase";

// const AuthContext = createContext({});

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [session, setSession] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchAndValidateSession = async () => {
//       setLoading(true);
//       console.log("AuthProvider: Validating session with server...");

//       // This call checks with the server if the user for the local session is still valid.
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       // We still get the session from local storage.
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       // Only set the session in our app state if the user is confirmed to be valid by the server.
//       // If the user was deleted, 'user' will be null, and therefore 'session' will be set to null.
//       setSession(user ? session : null);
//       console.log(
//         "AuthProvider: Validation complete.",
//         user ? "USER VALID" : "USER INVALID/DELETED"
//       );
//       setLoading(false);
//     };

//     fetchAndValidateSession();

//     // The onAuthStateChange listener remains the same, it handles live changes like login/logout.
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ session, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// import { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../lib/supabase";

// const AuthContext = createContext({});

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [session, setSession] = useState(null);
//   const [profile, setProfile] = useState(null); // NEW: State for the profile
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchInitialData = async () => {
//       // First, get the session from local storage
//       const {
//         data: { session: currentSession },
//       } = await supabase.auth.getSession();
//       setSession(currentSession);

//       // If there's a session, fetch the associated profile
//       if (currentSession) {
//         const { data: userProfile } = await supabase
//           .from("profiles")
//           .select("*")
//           .eq("user_id", currentSession.user.id)
//           .single();
//         setProfile(userProfile);
//       }
//       setLoading(false);
//     };

//     fetchInitialData();

//     // Listen for auth state changes
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (_event, session) => {
//       setSession(session);
//       // If user logs out, clear their profile data
//       if (!session) {
//         setProfile(null);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const value = {
//     session,
//     profile,
//     loading,
//     // Exposing the raw user object can also be useful
//     user: session?.user,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // State for the profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      // Get the current session from local storage
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);

      // If a session exists, fetch the user's profile data
      if (currentSession) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*") // Select all columns
          .eq("user_id", currentSession.user.id)
          .single();
        setProfile(userProfile);
      }
      setLoading(false);
    };

    fetchInitialData();

    // Listen for auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      // Clear profile data on logout
      if (!session) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Make the profile available to the whole app
  const value = {
    session,
    profile,
    loading,
    user: session?.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
