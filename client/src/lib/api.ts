import { httpBase, loadSettings } from "./settings";
import type { Meeting, MeetingDetail, Note } from "./types";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const settings = loadSettings();
  const resp = await fetch(`${httpBase(settings)}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new ApiError(resp.status, text || resp.statusText);
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  listMeetings: (q?: string) =>
    request<Meeting[]>(`/meetings${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  createMeeting: (title: string, attendees: string[] = []) =>
    request<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify({ title, attendees }),
    }),

  getMeeting: (id: string) => request<MeetingDetail>(`/meetings/${id}`),

  updateMeeting: (id: string, patch: Partial<Pick<Meeting, "title" | "attendees" | "status">>) =>
    request<Meeting>(`/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteMeeting: (id: string) =>
    request<void>(`/meetings/${id}`, { method: "DELETE" }),

  generateNotes: (id: string) =>
    request<Note>(`/meetings/${id}/generate-notes`, { method: "POST" }),

  updateNotes: (id: string, patch: Partial<Omit<Note, "edited_by_user" | "generated_at" | "updated_at">>) =>
    request<Note>(`/meetings/${id}/notes`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};

export { ApiError };
