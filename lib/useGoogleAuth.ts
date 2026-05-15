import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import { trpc } from "./trpc";

WebBrowser.maybeCompleteAuthSession();

// Configure your Google OAuth credentials here
// You need to create OAuth credentials in Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || "";

export function useGoogleAuth() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleLoginMutation = trpc.auth.googleLogin.useMutation();

  // Setup Google OAuth request
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    scopes: ["profile", "email"],
  });

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn(response.authentication?.accessToken);
    }
  }, [response]);

  const handleGoogleSignIn = async (accessToken?: string) => {
    if (!accessToken) {
      setError("Falha ao obter token de acesso");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user info from Google
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userInfoResponse.ok) {
        throw new Error("Falha ao obter informações do usuário");
      }

      const googleUserInfo = await userInfoResponse.json();

      // Login via backend
      const result = await googleLoginMutation.mutateAsync({
        email: googleUserInfo.email,
      });

      setUserInfo(result.user);
      return result.user;
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao fazer login com Google";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    try {
      const result = await promptAsync();
      if (result?.type !== "success") {
        setError("Login cancelado");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao iniciar login com Google");
    }
  };

  const signOut = () => {
    setUserInfo(null);
    setError(null);
  };

  return {
    userInfo,
    loading: loading || googleLoginMutation.isPending,
    error: error || (googleLoginMutation.isError ? "Erro ao fazer login" : null),
    signIn,
    signOut,
    isReady: !!request,
  };
}
