from fastapi import APIRouter, Depends
from ..auth import get_current_user, get_supabase

router = APIRouter()


@router.get("/unlocked")
async def get_unlocked_adventures(
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    res = sb.table("user_adventures").select("adventure").eq("user_id", user["id"]).execute()
    return [r["adventure"] for r in (res.data or [])]


@router.post("/complete/{adventure}")
async def complete_adventure(
    adventure: int,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    if 1 <= adventure <= 6:
        sb.table("user_adventures").upsert({
            "user_id": user["id"],
            "adventure": adventure + 1,
        }, on_conflict="user_id,adventure").execute()
    return {"ok": True, "unlocked": adventure + 1 if adventure < 7 else None}
