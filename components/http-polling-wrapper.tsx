import { useHttpPollingSync } from "@/lib/use-http-polling-sync";

/**
 * Wrapper component to enable HTTP polling sync.
 * Must be placed inside AppProvider to access useApp context.
 */
export function HttpPollingWrapper() {
  useHttpPollingSync();
  return null;
}
