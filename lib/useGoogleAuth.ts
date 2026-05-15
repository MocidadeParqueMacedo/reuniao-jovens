import { useEffect, useState, useRef } from "react";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

export function useGoogleAuth() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authInFlightRef = useRef(false);

  // Complete auth session on app load (native only)
  useEffect(() => {
    if (Platform.OS !== "web") {
      try {
        WebBrowser.maybeCompleteAuthSession();
      } catch (err) {
        // Ignore errors
      }
    }
  }, []);

  const signIn = async () => {
    if (loading || authInFlightRef.current) return;

    try {
      authInFlightRef.current = true;
      setLoading(true);
      setError(null);

      // Open Google login in browser
      const redirectUrl = "reuniao-de-jovens://oauth-callback";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=profile%20email`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === "success") {
        // Extract authorization code from URL
        const url = result.url;
        const code = new URL(url).searchParams.get("code");

        if (code) {
          // In a real app, exchange the code for tokens on your backend
          // For now, return a mock user
          setUserInfo({
            email: "user@example.com",
            id: "unknown",
            name: "User",
          });

          return {
            email: "user@example.com",
            id: "unknown",
            name: "User",
          };
        }
      } else if (result.type === "cancel") {
        setError("Login cancelado pelo usuário");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login com Google");
    } finally {
      authInFlightRef.current = false;
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUserInfo(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer logout");
    }
  };

  return {
    userInfo,
    loading,
    error,
    signIn,
    signOut,
    isReady: !!GOOGLE_CLIENT_ID,
  };
}
