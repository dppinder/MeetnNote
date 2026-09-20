import { useEffect, useRef } from "react";
import type { TranscriptSegment } from "../lib/types";

export function TranscriptPane({
  segments,
  interimText,
}: {
  segments: TranscriptSegment[];
  interimText: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [segments.length, interimText]);

  return (
    <div className="pane transcript-pane">
      <h3>Transcript</h3>
      <div className="transcript-scroll">
        {segments.length === 0 && !interimText && (
          <div className="empty-state">Transcript will appear here once you start recording.</div>
        )}
        {segments.map((seg) => (
          <p key={seg.id} className="transcript-line">
            {seg.speaker && <span className="speaker-label">{seg.speaker}: </span>}
            {seg.text}
          </p>
        ))}
        {interimText && <p className="transcript-line interim">{interimText}</p>}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
