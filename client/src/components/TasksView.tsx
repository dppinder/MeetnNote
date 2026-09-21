import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { ActionItemEntry } from "../lib/types";

export function TasksView({ onOpenMeeting }: { onOpenMeeting: (meetingId: string) => void }) {
  const [items, setItems] = useState<ActionItemEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listActionItems()
      .then(setItems)
      .catch((err) => setError(err instanceof ApiError ? err.message : String(err)));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!items) return <div className="loading">Loading...</div>;

  const byMeeting = new Map<string, { title: string; items: ActionItemEntry[] }>();
  for (const item of items) {
    if (!byMeeting.has(item.meeting_id)) {
      byMeeting.set(item.meeting_id, { title: item.meeting_title, items: [] });
    }
    byMeeting.get(item.meeting_id)!.items.push(item);
  }

  return (
    <div className="meeting-view-inner">
      <h1 className="title-input" style={{ pointerEvents: "none" }}>
        Tasks
      </h1>
      <p className="meeting-meta-line">Action items pulled from every meeting's notes.</p>

      {byMeeting.size === 0 && <div className="empty-state">No action items yet — generate notes on a meeting first.</div>}

      {[...byMeeting.entries()].map(([meetingId, group]) => (
        <div className="task-group" key={meetingId}>
          <button
            className="task-group-title"
            style={{
              all: "unset",
              cursor: "pointer",
              display: "block",
            }}
            onClick={() => onOpenMeeting(meetingId)}
          >
            <span className="task-group-title">{group.title || "Untitled meeting"}</span>
          </button>
          <div className="checklist">
            {group.items.map((item, i) => (
              <div className="checklist-item" key={i}>
                <span className="checklist-check action">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </span>
                <span className="checklist-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
