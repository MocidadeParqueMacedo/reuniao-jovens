import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

// Configure your Google OAuth credentials here
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";

export function useGoogleAuth() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authInProgressRef = useRef(false);
  const webBrowserInitializedRef = useRef(false);

  // Setup Google OAuth request
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ["profile", "email"],
  });

  // Initialize WebBrowser uma única vez
  useEffect(() => {
    if (!webBrowserInitializedRef.current && Platform.OS !== "web") {
      WebBrowser.maybeCompleteAuthSession();
      webBrowserInitializedRef.current = true;
    }
  }, []);

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn(response.authentication?.accessToken);
    } else if (response?.type === "error") {
      setError("Erro ao fazer login com Google");
      authInProgressRef.current = false;
      setLoading(false);
    } else if (response?.type === "dismiss") {
      authInProgressRef.current = false;
      setLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (accessToken?: string) => {
    if (!accessToken) {
      setError("Falha ao obter token de acesso");
      authInProgressRef.current = false;
      setLoading(false);
      return;
    }

    try {
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
    } finally {
      setLoading(false);
      authInProgressRef.current = false;
    }
  };

  const signIn = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (authInProgressRef.current || loading) {
      return;
    }

    if (!request) {
      setError("Google OAuth não está configurado");
      return;
    }

    try {
      authInProgressRef.current = true;
      setError(null);
      setLoading(true);

      const result = await promptAsync();
      
      // Se o usuário cancelou, resetar estados
      if (result?.type === "dismiss") {
        setLoading(false);
        authInProgressRef.current = false;
      }
      // Se houve erro, resetar estados
      if (result?.type === "error") {
        setError("Erro ao fazer login com Google");
        setLoading(false);
        authInProgressRef.current = false;
      }
      // Se sucesso, o useEffect acima vai processar
    } catch (err: any) {
      setError(err.message || "Erro ao iniciar login com Google");
      setLoading(false);
      authInProgressRef.current = false;
    }
  };

  const signOut = () => {
    setUserInfo(null);
    setError(null);
    authInProgressRef.current = false;
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
