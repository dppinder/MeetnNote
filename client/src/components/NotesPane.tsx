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

export function NotesPane({
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
  const [summary, setSummary] = useState("");
  const [discussionPoints, setDiscussionPoints] = useState("");
  const [decisions, setDecisions] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSummary(note?.summary ?? "");
    setDiscussionPoints(listToLines(note?.discussion_points ?? []));
    setDecisions(listToLines(note?.decisions ?? []));
    setActionItems(listToLines(note?.action_items ?? []));
    setDirty(false);
  }, [note]);

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  function save() {
    onSave({
      summary,
      discussion_points: linesToList(discussionPoints),
      decisions: linesToList(decisions),
      action_items: linesToList(actionItems),
    });
    setDirty(false);
  }

  return (
    <div className="pane notes-pane">
      <div className="notes-header">
        <h3>AI Notes</h3>
        <button onClick={onGenerate} disabled={generating}>
          {generating ? "Generating..." : note ? "Regenerate" : "Generate notes"}
        </button>
      </div>

      {!note && !generating && (
        <div className="empty-state">
          Record (or finish recording) a meeting, then generate notes from the transcript.
        </div>
      )}

      {(note || generating) && (
        <div className="notes-form">
          <label>
            Summary
            <textarea rows={3} value={summary} onChange={(e) => markDirty(setSummary)(e.target.value)} />
          </label>
          <label>
            Discussion points (one per line)
            <textarea
              rows={5}
              value={discussionPoints}
              onChange={(e) => markDirty(setDiscussionPoints)(e.target.value)}
            />
          </label>
          <label>
            Decisions (one per line)
            <textarea rows={3} value={decisions} onChange={(e) => markDirty(setDecisions)(e.target.value)} />
          </label>
          <label>
            Action items (one per line)
            <textarea rows={4} value={actionItems} onChange={(e) => markDirty(setActionItems)(e.target.value)} />
          </label>

          {dirty && (
            <button className="primary" onClick={save}>
              Save edits
            </button>
          )}
        </div>
      )}
    </div>
  );
}
