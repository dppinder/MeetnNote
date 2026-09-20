from fastapi import Header, HTTPException, WebSocket, status

from app.config import settings


def require_token(authorization: str | None = Header(default=None)) -> None:
    if authorization != f"Bearer {settings.auth_token}":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing token")


async def require_token_ws(websocket: WebSocket) -> bool:
    token = websocket.query_params.get("token")
    if token != settings.auth_token:
        await websocket.close(code=4401)
        return False
    return True
