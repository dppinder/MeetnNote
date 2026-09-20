import { useState } from "react";
import type { Meeting } from "../lib/types";

export function Sidebar({
  meetings,
  selectedId,
  onSelect,
  onNewMeeting,
  onSearch,
  onOpenSettings,
  className = "",
}: {
  meetings: Meeting[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewMeeting: () => void;
  onSearch: (q: string) => void;
  onOpenSettings: () => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  return (
    <div className={`sidebar ${className}`}>
      <div className="sidebar-header">
        <button className="primary new-meeting-btn" onClick={onNewMeeting}>
          + New meeting
        </button>
        <button className="icon-btn" title="Settings" onClick={onOpenSettings}>
          ⚙
        </button>
      </div>

      <input
        className="search-box"
        type="text"
        placeholder="Search meetings..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSearch(e.target.value);
        }}
      />

      <div className="meeting-list">
        {meetings.length === 0 && <div className="empty-state">No meetings yet</div>}
        {meetings.map((m) => (
          <div
            key={m.id}
            className={`meeting-item ${m.id === selectedId ? "selected" : ""}`}
            onClick={() => onSelect(m.id)}
          >
            <div className="meeting-item-title">{m.title || "Untitled meeting"}</div>
            <div className="meeting-item-meta">
              {new Date(m.created_at).toLocaleString()}
              {m.status === "recording" && <span className="badge-recording">recording</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
