import * as ReactNative from "react-native";
import Constants from "expo-constants";

// Extract scheme from bundle ID (last segment timestamp, prefixed with "manus")
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const bundleId = "com.app.reuniaojovens";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * Get the API base URL for server communication.
 * Priority:
 * 1. EXPO_PUBLIC_API_BASE_URL environment variable (for production/tunnels)
 * 2. LAN IP detection (for development on same network)
 * 3. Manus sandbox URL (web only)
 * 4. Empty string (fallback)
 */
export function getApiBaseUrl(): string {
  // 1. If API_BASE_URL is explicitly set, use it (highest priority)
  if (API_BASE_URL) {
    console.log("[getApiBaseUrl] Using EXPO_PUBLIC_API_BASE_URL env:", API_BASE_URL);
    return API_BASE_URL.replace(/\/$/, "");
  }

  // 2. On native (iOS/Android), try to detect LAN IP
  if (ReactNative.Platform.OS !== "web") {
    try {
      const hostUri = Constants.expoConfig?.hostUri;
      console.log("[getApiBaseUrl] Mobile - hostUri:", hostUri);
      
      if (hostUri) {
        // hostUri format: "192.168.x.x:8081" or "8081-sandbox.region.manus.computer:8081"
        const hostname = hostUri.split(":")[0];
        
        // If it's a LAN IP (192.168.x.x or 10.x.x.x), use it with port 3000
        if (/^(192\.168|10\.)/.test(hostname)) {
          const result = `http://${hostname}:3000`;
          console.log("[getApiBaseUrl] Detected LAN IP, using:", result);
          return result;
        }
        
        // If it's a manus.computer domain, it's sandbox preview - use as-is
        if (hostname.includes("manus.computer")) {
          const result = `https://${hostname}:3000`;
          console.log("[getApiBaseUrl] Detected Manus sandbox, using:", result);
          return result;
        }
      }
    } catch (error) {
      console.warn("[getApiBaseUrl] Failed to detect LAN IP:", error);
    }
  }

  // 3. On web, derive from current hostname (sandbox preview)
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    // Pattern: 8081-sandboxid.region.domain -> 3000-sandboxid.region.domain
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      console.log("[getApiBaseUrl] Derived from web hostname:", `${protocol}//${apiHostname}`);
      return `${protocol}//${apiHostname}`;
    }
  }

  // 4. Fallback to empty (will use relative URL)
  console.log("[getApiBaseUrl] No API base URL found - using fallback");
  return "";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  return Buffer.from(value).toString("base64");
};

const decodeState = (value: string) => {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(value);
  }
  return Buffer.from(value, "base64").toString("utf-8");
};

export const oauth = {
  encodeState,
  decodeState,
};
