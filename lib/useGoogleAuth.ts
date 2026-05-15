import { useEffect, useState, useRef } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

// Configure the redirect URI
const redirectUri = AuthSession.makeRedirectUri({
  scheme: "reuniao-de-jovens",
  path: "oauth-callback",
});

export function useGoogleAuth() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authInFlightRef = useRef(false);
  const requestRef = useRef<AuthSession.AuthRequest | null>(null);

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

      // Build the Google OAuth URL with proper parameters
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile%20email&access_type=offline&prompt=select_account`;

      // Use openAuthSessionAsync to open the browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success") {
        // Extract the authorization code from the URL
        const url = new URL(result.url);
        const code = url.searchParams.get("code");

        if (code) {
          // Exchange code for tokens on the backend
          // For now, return mock user data
          // In production, call your backend to exchange the code
          
          setUserInfo({
            email: "user@example.com",
            id: "unknown",
            name: "User",
            code: code, // Pass the code to the backend
          });

          return {
            email: "user@example.com",
            id: "unknown",
            name: "User",
            code: code,
          };
        } else {
          setError("Erro ao obter código de autorização");
        }
      } else if (result.type === "cancel") {
        setError("Login cancelado pelo usuário");
      } else {
        setError("Erro ao fazer login com Google");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login com Google");
      console.error("Google Auth Error:", err);
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
