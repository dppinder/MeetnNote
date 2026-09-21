import { useEffect, useState } from "react";
import type { Note } from "../lib/types";

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function listToLines(list: string[]): string {
  return list.join("\n");
}

export function SummaryView({
  note,
  generating,
  onGenerate,
  onSave,
}: {
  note: Note | null;
  generating: boolean;
  onGenerate: () => void;
  onSave: (patch: {
    summary: string;
    discussion_points: string[];
    decisions: string[];
    action_items: string[];
  }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState("");
  const [discussionPoints, setDiscussionPoints] = useState("");
  const [decisions, setDecisions] = useState("");
  const [actionItems, setActionItems] = useState("");

  useEffect(() => {
    setSummary(note?.summary ?? "");
    setDiscussionPoints(listToLines(note?.discussion_points ?? []));
    setDecisions(listToLines(note?.decisions ?? []));
    setActionItems(listToLines(note?.action_items ?? []));
  }, [note]);

  function save() {
    onSave({
      summary,
      discussion_points: linesToList(discussionPoints),
      decisions: linesToList(decisions),
      action_items: linesToList(actionItems),
    });
    setEditing(false);
  }

  if (!note && !generating) {
    return (
      <div className="card">
        <div className="empty-state">
          Record (or finish recording) a meeting, then generate notes from the transcript.
        </div>
        <button className="primary pill" onClick={onGenerate}>
          Generate notes
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="quick-actions">
        <button className="pill" onClick={onGenerate} disabled={generating}>
          <span className="material-symbols-outlined">auto_awesome</span>
          {generating ? "Generating..." : note ? "Regenerate" : "Generate notes"}
        </button>
        {note && !editing && (
          <button className="pill" onClick={() => setEditing(true)}>
            <span className="material-symbols-outlined">edit</span>
            Edit
          </button>
        )}
        {editing && (
          <button className="pill primary" onClick={save}>
            <span className="material-symbols-outlined">check</span>
            Save
          </button>
        )}
      </div>

      {note && !editing && (
        <>
          <div className="card">
            <div className="synopsis-card-head">
              <span className="synopsis-label">
                <span className="material-symbols-outlined">format_quote</span>
                Summary
              </span>
              <span className="ai-tag">AI synthesized</span>
            </div>
            <p className="synopsis-text" style={{ margin: 0 }}>
              {note.summary || "No summary yet."}
            </p>
          </div>

          {note.decisions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="section-head">
                <h2>Decisions</h2>
                <span className="section-count">{note.decisions.length}</span>
              </div>
              <div className="checklist">
                {note.decisions.map((d, i) => (
                  <div className="checklist-item" key={i}>
                    <span className="checklist-check">
                      <span className="material-symbols-outlined">check</span>
                    </span>
                    <span className="checklist-text">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {note.action_items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="section-head">
                <h2>Action items</h2>
                <span className="section-count">{note.action_items.length}</span>
              </div>
              <div className="checklist">
                {note.action_items.map((a, i) => (
                  <div className="checklist-item" key={i}>
                    <span className="checklist-check action">
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </span>
                    <span className="checklist-text">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {note.discussion_points.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="section-head">
                <h2>Discussion points</h2>
              </div>
              <div className="plain-list">
                {note.discussion_points.map((p, i) => (
                  <div className="plain-list-item" key={i}>
                    {p}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="card">
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
            Summary
            <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
            Decisions (one per line)
            <textarea rows={3} value={decisions} onChange={(e) => setDecisions(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
            Action items (one per line)
            <textarea rows={3} value={actionItems} onChange={(e) => setActionItems(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
            Discussion points (one per line)
            <textarea rows={4} value={discussionPoints} onChange={(e) => setDiscussionPoints(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
}
