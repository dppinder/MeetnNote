import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { loadSettings, saveSettings, type ServerSettings } from "../lib/settings";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<ServerSettings>(loadSettings());
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function testConnection() {
    saveSettings(settings);
    setStatus("testing");
    try {
      await api.health();
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof ApiError ? `${err.status}: ${err.message}` : String(err));
    }
  }

  function save() {
    saveSettings(settings);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Server settings</h2>
        <label>
          Server address (full URL)
          <input
            type="text"
            placeholder="https://192.168.1.162:8443"
            value={settings.serverUrl}
            onChange={(e) => setSettings({ ...settings, serverUrl: e.target.value })}
          />
        </label>
        <label>
          Auth token
          <input
            type="password"
            placeholder="from .env on the server"
            value={settings.token}
            onChange={(e) => setSettings({ ...settings, token: e.target.value })}
          />
        </label>

        <div className="modal-actions">
          <button onClick={testConnection} disabled={status === "testing"}>
            {status === "testing" ? "Testing..." : "Test connection"}
          </button>
          {status === "ok" && <span className="status-ok">Connected</span>}
          {status === "error" && <span className="status-error">{errorMsg}</span>}
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
