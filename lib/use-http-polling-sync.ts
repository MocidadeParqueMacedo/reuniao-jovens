import { useEffect, useRef } from "react";
import { useApp } from "./app-context";
import { getApiBaseUrl } from "@/constants/oauth";

/**
 * HTTP Polling fallback for WebSocket sync.
 * Polls the server every 5 seconds to fetch latest data.
 * Used when WebSocket fails or is unavailable.
 */
export function useHttpPollingSync() {
  const { setMembers, setMeetings, setEvents, setVisitors, setVisitas, setAtas, setVersinhos } = useApp();
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      console.log("[useHttpPollingSync] No API base URL - polling disabled");
      return;
    }

    console.log("[useHttpPollingSync] Starting HTTP polling with base URL:", apiBaseUrl);

    const pollData = async () => {
      try {
        // Fetch all data from server
        const [membersRes, meetingsRes, eventsRes, visitorsRes, visitasRes, atasRes, versinhosRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/members`, { method: "GET" }).catch(() => null),
          fetch(`${apiBaseUrl}/api/meetings`, { method: "GET" }).catch(() => null),
          fetch(`${apiBaseUrl}/api/events`, { method: "GET" }).catch(() => null),
          fetch(`${apiBaseUrl}/api/visitors`, { method: "GET" }).catch(() => null),
          fetch(`${apiBaseUrl}/api/visitas`, { method: "GET" }).catch(() => null),
          fetch(`${apiBaseUrl}/api/atas`, { method: "GET" }).catch(() => null),
          fetch(`${apiBaseUrl}/api/versinhos`, { method: "GET" }).catch(() => null),
        ]);

        // Process responses
        if (membersRes?.ok) {
          const data = await membersRes.json();
          if (data.data) setMembers(data.data);
        }
        if (meetingsRes?.ok) {
          const data = await meetingsRes.json();
          if (data.data) setMeetings(data.data);
        }
        if (eventsRes?.ok) {
          const data = await eventsRes.json();
          if (data.data) setEvents(data.data);
        }
        if (visitorsRes?.ok) {
          const data = await visitorsRes.json();
          if (data.data) setVisitors(data.data);
        }
        if (visitasRes?.ok) {
          const data = await visitasRes.json();
          if (data.data) setVisitas(data.data);
        }
        if (atasRes?.ok) {
          const data = await atasRes.json();
          if (data.data) setAtas(data.data);
        }
        if (versinhosRes?.ok) {
          const data = await versinhosRes.json();
          if (data.data) setVersinhos(data.data);
        }

        console.log("[useHttpPollingSync] Data synced successfully");
      } catch (error) {
        console.warn("[useHttpPollingSync] Polling error:", error);
      }
    };

    // Initial sync
    pollData();

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(pollData, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [setMembers, setMeetings, setEvents, setVisitors, setVisitas, setAtas, setVersinhos]);
}
