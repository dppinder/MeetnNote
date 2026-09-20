import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { listAudioInputDevices, MeetingRecorder } from "../lib/audio";
import type { MeetingDetail, TranscriptSegment, WsServerMessage } from "../lib/types";
import { TranscriptPane } from "./TranscriptPane";
import { NotesPane } from "./NotesPane";

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
  const recorderRef = useRef<MeetingRecorder | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setSegments([]);
    setInterimText("");
    setError(null);

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
      // Refresh device labels now that permission has been granted.
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

  async function commitTitle() {
    if (!detail || titleDraft === detail.title) return;
    const updated = await api.updateMeeting(meetingId, { title: titleDraft });
    setDetail((d) => (d ? { ...d, title: updated.title } : d));
    onMeetingChanged();
  }

  if (!detail) return <div className="meeting-view loading">Loading...</div>;

  return (
    <div className="meeting-view">
      <div className="meeting-view-header">
        <input
          className="title-input"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
        />

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
            <button className="primary record-btn" onClick={startRecording}>
              ● Start recording
            </button>
          ) : (
            <button className="stop-btn" onClick={stopRecording}>
              ■ Stop recording
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="meeting-view-body">
        <TranscriptPane segments={segments} interimText={interimText} />
        <NotesPane note={detail.note} generating={generating} onGenerate={generateNotes} onSave={saveNotes} />
      </div>
    </div>
  );
}
