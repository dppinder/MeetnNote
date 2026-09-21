import type { MeetingDetail } from "./types";

function section(title: string, items: string[]): string {
  if (items.length === 0) return "";
  return `## ${title}\n\n${items.map((i) => `- ${i}`).join("\n")}\n\n`;
}

export function meetingToMarkdown(meeting: MeetingDetail): string {
  const parts: string[] = [];
  parts.push(`# ${meeting.title || "Untitled meeting"}\n\n`);
  parts.push(`_${new Date(meeting.created_at).toLocaleString()}_`);
  if (meeting.attendees.length > 0) {
    parts.push(` — ${meeting.attendees.join(", ")}`);
  }
  parts.push("\n\n");

  const note = meeting.note;
  if (note?.summary) {
    parts.push(`## Summary\n\n${note.summary}\n\n`);
  }
  if (note) {
    parts.push(section("Decisions", note.decisions));
    parts.push(section("Action items", note.action_items));
    parts.push(section("Discussion points", note.discussion_points));
  }

  return parts.join("").trim() + "\n";
}
