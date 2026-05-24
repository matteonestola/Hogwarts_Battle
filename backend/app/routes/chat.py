from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_current_user, get_supabase
from ..models.schemas import ChatMessageRequest

router = APIRouter()


@router.post("/{code}/chat")
async def send_message(
    code: str,
    body: ChatMessageRequest,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    room_res = sb.table("rooms").select("id").eq("code", code.upper()).single().execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Room not found")

    sb.table("chat_messages").insert({
        "room_id": room_res.data["id"],
        "user_id": user["id"],
        "content": body.content,
    }).execute()

    return {"ok": True}


@router.get("/{code}/chat")
async def get_messages(
    code: str,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    room_res = sb.table("rooms").select("id").eq("code", code.upper()).single().execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Room not found")

    res = sb.table("chat_messages").select(
        "*, users(display_name)"
    ).eq("room_id", room_res.data["id"]).order("created_at").limit(50).execute()

    return res.data or []
