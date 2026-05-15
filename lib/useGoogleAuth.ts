import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";

WebBrowser.maybeCompleteAuthSession();

// Configure your Google OAuth credentials here
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

export function useGoogleAuth() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup Google OAuth request
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn(response.authentication?.accessToken);
    } else if (response?.type === "error") {
      setError("Erro ao fazer login com Google: " + (response.error?.message || "Desconhecido"));
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
      setUserInfo(googleUserInfo);
      return googleUserInfo;
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
      setError(null);
      setLoading(true);
      
      if (!request) {
        setError("Google OAuth não está configurado");
        return;
      }

      const result = await promptAsync();
      
      if (result?.type === "cancel") {
        setError("Login cancelado pelo usuário");
      } else if (result?.type === "error") {
        setError("Erro ao fazer login: " + (result.error?.message || "Desconhecido"));
      }
      // Se type === "success", o useEffect acima vai processar
    } catch (err: any) {
      setError(err.message || "Erro ao iniciar login com Google");
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUserInfo(null);
    setError(null);
  };

  return {
    userInfo,
    loading,
    error,
    signIn,
    signOut,
    isReady: !!request,
  };
}
