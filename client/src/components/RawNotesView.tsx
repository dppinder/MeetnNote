import { useEffect, useRef, useState } from "react";

export function RawNotesView({
  value,
  onSave,
}: {
  value: string;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(value);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  function handleChange(next: string) {
    setText(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSave(next);
      setSavedAt(Date.now());
    }, 800);
  }

  return (
    <div className="card">
      <div className="section-head">
        <h2>Your notes</h2>
        {savedAt && <span className="save-hint">Saved</span>}
      </div>
      <textarea
        className="raw-notes-textarea"
        placeholder="Jot anything down during or after the meeting — this is just for you, separate from the AI summary."
        value={text}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
}
