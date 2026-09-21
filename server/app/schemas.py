from datetime import datetime

from pydantic import BaseModel


class MeetingCreate(BaseModel):
    title: str = "Untitled meeting"
    attendees: list[str] = []


class MeetingUpdate(BaseModel):
    title: str | None = None
    attendees: list[str] | None = None
    status: str | None = None


class TranscriptSegmentOut(BaseModel):
    id: str
    start_ms: int
    end_ms: int
    speaker: str | None
    text: str

    model_config = {"from_attributes": True}


class NoteOut(BaseModel):
    summary: str
    discussion_points: list[str]
    decisions: list[str]
    action_items: list[str]
    personal_notes: str
    edited_by_user: bool
    generated_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteUpdate(BaseModel):
    summary: str | None = None
    discussion_points: list[str] | None = None
    decisions: list[str] | None = None
    action_items: list[str] | None = None
    personal_notes: str | None = None


class MeetingOut(BaseModel):
    id: str
    title: str
    attendees: list[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MeetingDetailOut(MeetingOut):
    segments: list[TranscriptSegmentOut]
    note: NoteOut | None


class ActionItemEntry(BaseModel):
    meeting_id: str
    meeting_title: str
    meeting_created_at: datetime
    text: str
