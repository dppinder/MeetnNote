from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_token
from app.db import Meeting, Note, get_session
from app.schemas import ActionItemEntry

router = APIRouter(tags=["tasks"], dependencies=[Depends(require_token)])


@router.get("/action-items", response_model=list[ActionItemEntry])
async def list_action_items(session: AsyncSession = Depends(get_session)):
    stmt = (
        select(Meeting.id, Meeting.title, Meeting.created_at, Note.action_items)
        .join(Note, Note.meeting_id == Meeting.id)
        .order_by(Meeting.created_at.desc())
    )
    result = await session.execute(stmt)

    entries: list[ActionItemEntry] = []
    for meeting_id, meeting_title, meeting_created_at, action_items in result.all():
        for text in action_items:
            entries.append(
                ActionItemEntry(
                    meeting_id=meeting_id,
                    meeting_title=meeting_title,
                    meeting_created_at=meeting_created_at,
                    text=text,
                )
            )
    return entries
