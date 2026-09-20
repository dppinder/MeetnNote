export interface Meeting {
  id: string;
  title: string;
  attendees: string[];
  status: "recording" | "completed";
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: string;
  start_ms: number;
  end_ms: number;
  speaker: string | null;
  text: string;
}

export interface Note {
  summary: string;
  discussion_points: string[];
  decisions: string[];
  action_items: string[];
  edited_by_user: boolean;
  generated_at: string;
  updated_at: string;
}

export interface MeetingDetail extends Meeting {
  segments: TranscriptSegment[];
  note: Note | null;
}

export type WsServerMessage =
  | { type: "interim"; text: string }
  | { type: "final"; segment: { start_ms: number; end_ms: number; text: string } }
  | { type: "stopped" };
