import { useEffect, useRef } from "react";
import type { TranscriptSegment } from "../lib/types";

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

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

  if (segments.length === 0 && !interimText) {
    return <div className="empty-state">Transcript will appear here once you start recording.</div>;
  }

  return (
    <div className="transcript-scroll">
      {segments.map((seg) => (
        <div className="transcript-block" key={seg.id}>
          <div className="transcript-block-head">
            <span className="transcript-speaker">{seg.speaker || "Transcript"}</span>
            <span className="transcript-time">{formatTime(seg.start_ms)}</span>
          </div>
          <p className="transcript-text" style={{ margin: 0 }}>
            {seg.text}
          </p>
        </div>
      ))}
      {interimText && (
        <div className="transcript-block">
          <p className="transcript-text interim" style={{ margin: 0 }}>
            {interimText}
          </p>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
