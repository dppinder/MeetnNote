from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_token
from app.db import Meeting, Note, TranscriptSegment, get_session
from app.schemas import (
    MeetingCreate,
    MeetingDetailOut,
    MeetingOut,
    MeetingUpdate,
    NoteOut,
    NoteUpdate,
)
from app.services.notes import generate_meeting_notes

router = APIRouter(prefix="/meetings", tags=["meetings"], dependencies=[Depends(require_token)])


async def _get_meeting_or_404(meeting_id: str, session: AsyncSession, with_children: bool = False) -> Meeting:
    stmt = select(Meeting).where(Meeting.id == meeting_id)
    if with_children:
        stmt = stmt.options(selectinload(Meeting.segments), selectinload(Meeting.note))
    result = await session.execute(stmt)
    meeting = result.scalar_one_or_none()
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.post("", response_model=MeetingOut)
async def create_meeting(body: MeetingCreate, session: AsyncSession = Depends(get_session)):
    meeting = Meeting(title=body.title, attendees=body.attendees)
    session.add(meeting)
    await session.commit()
    await session.refresh(meeting)
    return meeting


@router.get("", response_model=list[MeetingOut])
async def list_meetings(q: str | None = None, session: AsyncSession = Depends(get_session)):
    stmt = select(Meeting).order_by(Meeting.created_at.desc())
    if q:
        stmt = stmt.where(Meeting.title.ilike(f"%{q}%"))
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/{meeting_id}", response_model=MeetingDetailOut)
async def get_meeting(meeting_id: str, session: AsyncSession = Depends(get_session)):
    return await _get_meeting_or_404(meeting_id, session, with_children=True)


@router.patch("/{meeting_id}", response_model=MeetingOut)
async def update_meeting(meeting_id: str, body: MeetingUpdate, session: AsyncSession = Depends(get_session)):
    meeting = await _get_meeting_or_404(meeting_id, session)
    if body.title is not None:
        meeting.title = body.title
    if body.attendees is not None:
        meeting.attendees = body.attendees
    if body.status is not None:
        meeting.status = body.status
    await session.commit()
    await session.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}", status_code=204)
async def delete_meeting(meeting_id: str, session: AsyncSession = Depends(get_session)):
    meeting = await _get_meeting_or_404(meeting_id, session)
    await session.delete(meeting)
    await session.commit()


@router.post("/{meeting_id}/generate-notes", response_model=NoteOut)
async def generate_notes(meeting_id: str, session: AsyncSession = Depends(get_session)):
    meeting = await _get_meeting_or_404(meeting_id, session, with_children=True)
    segments = [
        {"speaker": s.speaker, "text": s.text} for s in sorted(meeting.segments, key=lambda s: s.start_ms)
    ]
    structured, raw = await generate_meeting_notes(segments)

    note = meeting.note
    if note is None:
        note = Note(meeting_id=meeting.id)
        session.add(note)
    note.summary = structured["summary"]
    note.discussion_points = structured["discussion_points"]
    note.decisions = structured["decisions"]
    note.action_items = structured["action_items"]
    note.raw_model_output = raw
    note.edited_by_user = False

    await session.commit()
    await session.refresh(note)
    return note


@router.patch("/{meeting_id}/notes", response_model=NoteOut)
async def update_notes(meeting_id: str, body: NoteUpdate, session: AsyncSession = Depends(get_session)):
    meeting = await _get_meeting_or_404(meeting_id, session, with_children=True)
    note = meeting.note
    if note is None:
        note = Note(meeting_id=meeting.id)
        session.add(note)
    if body.summary is not None:
        note.summary = body.summary
    if body.discussion_points is not None:
        note.discussion_points = body.discussion_points
    if body.decisions is not None:
        note.decisions = body.decisions
    if body.action_items is not None:
        note.action_items = body.action_items
        note.edited_by_user = True
    if body.summary is not None or body.discussion_points is not None or body.decisions is not None:
        note.edited_by_user = True
    if body.personal_notes is not None:
        note.personal_notes = body.personal_notes

    await session.commit()
    await session.refresh(note)
    return note
