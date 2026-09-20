import { useEffect, useState } from "react";
import { api, ApiError } from "./lib/api";
import { loadSettings } from "./lib/settings";
import type { Meeting } from "./lib/types";
import { Sidebar } from "./components/Sidebar";
import { MeetingView } from "./components/MeetingView";
import { SettingsModal } from "./components/SettingsModal";

export default function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function refreshMeetings(q?: string) {
    try {
      const list = await api.listMeetings(q);
      setMeetings(list);
      setConnectionError(null);
    } catch (err) {
      setConnectionError(err instanceof ApiError ? err.message : "Could not reach the server.");
    }
  }

  useEffect(() => {
    const settings = loadSettings();
    if (!settings.token) {
      setSettingsOpen(true);
      return;
    }
    refreshMeetings();
  }, []);

  async function handleNewMeeting() {
    const meeting = await api.createMeeting("Untitled meeting");
    await refreshMeetings();
    setSelectedId(meeting.id);
    setSidebarOpen(false);
  }

  return (
    <div className="app">
      <div className="mobile-topbar">
        <button className="icon-btn" aria-label="Open meeting list" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>
        <span className="mobile-topbar-title">MeetnNote</span>
      </div>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <Sidebar
        className={sidebarOpen ? "open" : ""}
        meetings={meetings}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setSidebarOpen(false);
        }}
        onNewMeeting={handleNewMeeting}
        onSearch={(q) => refreshMeetings(q || undefined)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="main-content">
        {connectionError && (
          <div className="error-banner">
            {connectionError} — check <button onClick={() => setSettingsOpen(true)}>Settings</button>
          </div>
        )}
        {selectedId ? (
          <MeetingView meetingId={selectedId} onMeetingChanged={() => refreshMeetings()} />
        ) : (
          <div className="empty-state centered">Select a meeting, or start a new one.</div>
        )}
      </div>

      {settingsOpen && (
        <SettingsModal
          onClose={() => {
            setSettingsOpen(false);
            refreshMeetings();
          }}
        />
      )}
    </div>
  );
}
