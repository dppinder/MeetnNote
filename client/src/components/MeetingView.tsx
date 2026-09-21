import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { listAudioInputDevices, MeetingRecorder } from "../lib/audio";
import { meetingToMarkdown } from "../lib/markdown";
import type { MeetingDetail, TranscriptSegment, WsServerMessage } from "../lib/types";
import { TranscriptPane } from "./TranscriptPane";
import { SummaryView } from "./SummaryView";
import { RawNotesView } from "./RawNotesView";
import { SegmentedTabs, type TabDef } from "./SegmentedTabs";

type MainTab = "summary" | "raw" | "transcript";

const TABS: TabDef<MainTab>[] = [
  { key: "summary", label: "Summary", icon: "auto_awesome" },
  { key: "raw", label: "Your Notes", icon: "edit_note" },
  { key: "transcript", label: "Transcript", icon: "graphic_eq" },
];

function formatDuration(segments: TranscriptSegment[]): string | null {
  if (segments.length === 0) return null;
  const start = Math.min(...segments.map((s) => s.start_ms));
  const end = Math.max(...segments.map((s) => s.end_ms));
  const mins = Math.round((end - start) / 60000);
  if (mins < 1) return "<1 min";
  return `${mins} min${mins === 1 ? "" : "s"}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function MeetingView({
  meetingId,
  onMeetingChanged,
}: {
  meetingId: string;
  onMeetingChanged: () => void;
}) {
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState("");
  const [recording, setRecording] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [titleDraft, setTitleDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<MainTab>("summary");
  const [copyLabel, setCopyLabel] = useState("Copy Markdown");
  const recorderRef = useRef<MeetingRecorder | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setSegments([]);
    setInterimText("");
    setError(null);
    setTab("summary");

    api.getMeeting(meetingId).then((m) => {
      if (cancelled) return;
      setDetail(m);
      setSegments(m.segments);
      setTitleDraft(m.title);
    });

    listAudioInputDevices()
      .then((d) => !cancelled && setDevices(d))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
    };
  }, [meetingId]);

  function handleWsMessage(msg: WsServerMessage) {
    if (msg.type === "interim") {
      setInterimText(msg.text);
    } else if (msg.type === "final") {
      setInterimText("");
      setSegments((prev) => [
        ...prev,
        {
          id: `${msg.segment.start_ms}-${msg.segment.end_ms}`,
          start_ms: msg.segment.start_ms,
          end_ms: msg.segment.end_ms,
          speaker: null,
          text: msg.segment.text,
        },
      ]);
    }
  }

  async function startRecording() {
    setError(null);
    const recorder = new MeetingRecorder(meetingId, handleWsMessage, (err) => {
      setError(err.message);
      setRecording(false);
    });
    try {
      await recorder.start(deviceId);
      recorderRef.current = recorder;
      setRecording(true);
      listAudioInputDevices()
        .then(setDevices)
        .catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function stopRecording() {
    await recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    setInterimText("");
    await api.updateMeeting(meetingId, { status: "completed" });
    onMeetingChanged();
  }

  async function generateNotes() {
    setGenerating(true);
    setError(null);
    try {
      const note = await api.generateNotes(meetingId);
      setDetail((d) => (d ? { ...d, note } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function saveNotes(patch: {
    summary: string;
    discussion_points: string[];
    decisions: string[];
    action_items: string[];
  }) {
    try {
      const note = await api.updateNotes(meetingId, patch);
      setDetail((d) => (d ? { ...d, note } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function savePersonalNotes(personal_notes: string) {
    try {
      const note = await api.updateNotes(meetingId, { personal_notes });
      setDetail((d) => (d ? { ...d, note } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function commitTitle() {
    if (!detail || titleDraft === detail.title) return;
    const updated = await api.updateMeeting(meetingId, { title: titleDraft });
    setDetail((d) => (d ? { ...d, title: updated.title } : d));
    onMeetingChanged();
  }

  async function handleCopyMarkdown() {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(meetingToMarkdown(detail));
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy Markdown"), 1800);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }

  async function handleShare() {
    if (!detail) return;
    const text = meetingToMarkdown(detail);
    if (navigator.share) {
      try {
        await navigator.share({ title: detail.title, text });
      } catch {
        // user cancelled the share sheet — not an error
      }
    } else {
      await handleCopyMarkdown();
    }
  }

  if (!detail) return <div className="meeting-view loading">Loading...</div>;

  const duration = formatDuration(segments);

  return (
    <div className="meeting-view">
      <div className="meeting-view-inner">
        <div className="status-row">
          {detail.status === "recording" ? (
            <span className="status-chip recording">
              <span className="dot"></span>
              {recording ? "Recording" : "Draft"}
            </span>
          ) : (
            <span className="status-chip completed">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                check
              </span>
              Completed
            </span>
          )}
        </div>

        <input className="title-input" value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} onBlur={commitTitle} />

        <p className="meeting-meta-line">
          <span className="material-symbols-outlined">event_available</span>
          {new Date(detail.created_at).toLocaleString()}
          {duration && ` • ${duration}`}
          {detail.attendees.length > 0 && ` • ${detail.attendees.length} attendee${detail.attendees.length === 1 ? "" : "s"}`}
        </p>

        {detail.attendees.length > 0 && (
          <div className="attendee-chips">
            {detail.attendees.map((a, i) => (
              <span className="attendee-chip" key={i}>
                <span className="attendee-avatar">{initials(a)}</span>
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="quick-actions">
          <button className="pill primary" onClick={handleShare}>
            <span className="material-symbols-outlined">ios_share</span>
            Share Note
          </button>
          <button className="pill" onClick={handleCopyMarkdown}>
            <span className="material-symbols-outlined">markdown</span>
            {copyLabel}
          </button>
        </div>

        <div className="recording-controls">
          {!recording && (
            <select value={deviceId ?? ""} onChange={(e) => setDeviceId(e.target.value || undefined)}>
              <option value="">Default input device</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone (${d.deviceId.slice(0, 6)})`}
                </option>
              ))}
            </select>
          )}
          {!recording ? (
            <button className="pill record-btn" onClick={startRecording}>
              <span className="material-symbols-outlined">fiber_manual_record</span>
              Start recording
            </button>
          ) : (
            <button className="pill stop-btn" onClick={stopRecording}>
              <span className="material-symbols-outlined">stop</span>
              Stop recording
            </button>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <SegmentedTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "summary" && (
          <SummaryView note={detail.note} generating={generating} onGenerate={generateNotes} onSave={saveNotes} />
        )}
        {tab === "raw" && <RawNotesView value={detail.note?.personal_notes ?? ""} onSave={savePersonalNotes} />}
        {tab === "transcript" && <TranscriptPane segments={segments} interimText={interimText} />}
      </div>
    </div>
  );
}
