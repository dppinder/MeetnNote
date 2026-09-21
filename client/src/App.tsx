import { useEffect, useState } from "react";
import { api, ApiError } from "./lib/api";
import { loadSettings } from "./lib/settings";
import { useIsMobile } from "./lib/useIsMobile";
import type { Meeting } from "./lib/types";
import { Sidebar } from "./components/Sidebar";
import { MeetingView } from "./components/MeetingView";
import { SettingsModal } from "./components/SettingsModal";
import { TasksView } from "./components/TasksView";
import { BottomNav, type AppPage } from "./components/BottomNav";

export default function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [page, setPage] = useState<AppPage>("meeting");
  const isMobile = useIsMobile();

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
    setPage("meeting");
  }

  function selectMeeting(id: string) {
    setSelectedId(id);
    setPage("meeting");
  }

  const sidebar = (
    <Sidebar
      meetings={meetings}
      selectedId={selectedId}
      onSelect={selectMeeting}
      onNewMeeting={handleNewMeeting}
      onSearch={(q) => refreshMeetings(q || undefined)}
      onOpenSettings={() => setSettingsOpen(true)}
      onOpenTasks={isMobile ? undefined : () => setPage("tasks")}
    />
  );

  const meetingOrEmpty = selectedId ? (
    <MeetingView meetingId={selectedId} onMeetingChanged={() => refreshMeetings()} />
  ) : (
    <div className="empty-state centered">Select a meeting, or start a new one.</div>
  );

  return (
    <div className="app">
      {isMobile ? (
        <>
          <div className="main-content">
            {connectionError && (
              <div className="error-banner">
                {connectionError} — check <button onClick={() => setSettingsOpen(true)}>Settings</button>
              </div>
            )}
            {page === "library" && sidebar}
            {page === "tasks" && <TasksView onOpenMeeting={selectMeeting} />}
            {page === "meeting" && meetingOrEmpty}
          </div>
          <BottomNav page={page} onNavigate={setPage} onRecord={handleNewMeeting} />
        </>
      ) : (
        <>
          {sidebar}
          <div className="main-content">
            {connectionError && (
              <div className="error-banner">
                {connectionError} — check <button onClick={() => setSettingsOpen(true)}>Settings</button>
              </div>
            )}
            {page === "tasks" ? <TasksView onOpenMeeting={selectMeeting} /> : meetingOrEmpty}
          </div>
        </>
      )}

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
