import random
import string
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..auth import get_current_user, get_supabase
from ..models.schemas import CreateRoomRequest, AssignHeroesRequest

router = APIRouter()


def _gen_code(n=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))


@router.post("")
async def create_room(
    body: CreateRoomRequest,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    code = _gen_code()
    res = sb.table("rooms").insert({
        "code": code,
        "host_id": user["id"],
        "adventure": body.adventure,
        "status": "lobby",
        "language": body.language,
        "game_state": None,
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create room")

    room = res.data[0]
    sb.table("room_players").insert({
        "room_id": room["id"],
        "user_id": user["id"],
        "turn_order": 0,
    }).execute()

    return room


@router.get("/{code}")
async def get_room(
    code: str,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    res = sb.table("rooms").select("*").eq("code", code.upper()).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Room not found")
    return res.data


@router.post("/{code}/join")
async def join_room(
    code: str,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    room_res = sb.table("rooms").select("*").eq("code", code.upper()).single().execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Room not found")

    room = room_res.data
    if room["status"] != "lobby":
        raise HTTPException(status_code=400, detail="Room already started")

    existing = sb.table("room_players").select("id").eq("room_id", room["id"]).eq("user_id", user["id"]).execute()
    if not existing.data:
        count_res = sb.table("room_players").select("id", count="exact").eq("room_id", room["id"]).execute()
        turn_order = count_res.count or 0
        sb.table("room_players").insert({
            "room_id": room["id"],
            "user_id": user["id"],
            "turn_order": turn_order,
        }).execute()

    return room


@router.post("/{code}/assign-heroes")
async def assign_heroes(
    code: str,
    body: AssignHeroesRequest,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    room_res = sb.table("rooms").select("id").eq("code", code.upper()).single().execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Room not found")

    sb.table("room_players").update({
        "hero": body.heroes[0] if body.heroes else None,
        "controlled_heroes": body.heroes,
    }).eq("room_id", room_res.data["id"]).eq("user_id", body.player_id).execute()

    return {"ok": True}


@router.delete("/{code}")
async def leave_room(
    code: str,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    room_res = sb.table("rooms").select("*").eq("code", code.upper()).single().execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Room not found")

    room = room_res.data
    sb.table("room_players").delete().eq("room_id", room["id"]).eq("user_id", user["id"]).execute()

    if room["host_id"] == user["id"]:
        sb.table("rooms").update({"status": "finished"}).eq("id", room["id"]).execute()

    return {"ok": True}


class TransferHeroRequest(BaseModel):
    from_player_id: str
    to_player_id: str

@router.post("/{code}/transfer-hero")
async def transfer_hero(
    code: str,
    body: TransferHeroRequest,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    room_res = sb.table("rooms").select("*").eq("code", code.upper()).single().execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Room not found")
    room = room_res.data
    if room["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only host can transfer heroes")

    game_state = room["game_state"]
    if game_state:
        for hero in game_state["heroes"].values():
            if hero["player_id"] == body.from_player_id:
                hero["player_id"] = body.to_player_id
        if game_state["active_player_id"] == body.from_player_id:
            game_state["active_player_id"] = body.to_player_id
        sb.table("rooms").update({"game_state": game_state}).eq("id", room["id"]).execute()

    return {"ok": True}
