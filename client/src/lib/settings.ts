export interface ServerSettings {
  serverUrl: string; // full base URL, e.g. "https://192.168.1.162:8443"
  token: string;
}

const KEY = "meetnnote:settings";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function defaultServerUrl(): string {
  // When this page is served directly by the MeetnNote server (the PWA case
  // on a phone), default to wherever it was loaded from — no typing an IP.
  // The Tauri desktop shell uses its own custom origin, so it falls back to
  // a placeholder the user fills in via Settings.
  if (!isTauri() && typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    return window.location.origin;
  }
  return "https://192.168.1.162:8443";
}

function defaults(): ServerSettings {
  return { serverUrl: defaultServerUrl(), token: "" };
}

export function loadSettings(): ServerSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

export function saveSettings(settings: ServerSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function httpBase(settings: ServerSettings): string {
  return settings.serverUrl.replace(/\/+$/, "");
}

export function wsBase(settings: ServerSettings): string {
  return httpBase(settings).replace(/^http/, "ws");
}
