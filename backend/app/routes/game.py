from fastapi import APIRouter, Depends, HTTPException
from ..auth import get_current_user, get_supabase
from ..models.schemas import GameActionRequest
from ..engine.game_engine import build_initial_state, apply_action

router = APIRouter()


@router.post("/{code}/start")
async def start_game(
    code: str,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    room_res = sb.table("rooms").select("*").eq("code", code.upper()).single().execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Room not found")

    room = room_res.data
    if room["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only host can start")
    if room["status"] != "lobby":
        raise HTTPException(status_code=400, detail="Game already started")

    players_res = sb.table("room_players").select("*").eq("room_id", room["id"]).order("turn_order").execute()
    players = players_res.data or []

    if not players:
        raise HTTPException(status_code=400, detail="No players in room")

    hero_assignments = {}
    for p in players:
        for hero in (p.get("controlled_heroes") or [p.get("hero")] if p.get("hero") else []):
            if hero:
                hero_assignments[hero] = p["user_id"]

    if not hero_assignments:
        heroes_default = ["harry", "ron", "hermione", "neville"]
        for i, p in enumerate(players):
            hero_assignments[heroes_default[i % 4]] = p["user_id"]

    game_state = build_initial_state(room["adventure"], hero_assignments)

    sb.table("rooms").update({
        "status": "playing",
        "game_state": game_state,
    }).eq("id", room["id"]).execute()

    _log_event(sb, room["id"], 1, "game_start", {"adventure": room["adventure"]})

    return {"ok": True, "game_state": game_state}


@router.post("/{code}/action")
async def game_action(
    code: str,
    body: GameActionRequest,
    user: dict = Depends(get_current_user),
    sb=Depends(get_supabase),
):
    room_res = sb.table("rooms").select("*").eq("code", code.upper()).single().execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Room not found")

    room = room_res.data
    if room["status"] != "playing":
        raise HTTPException(status_code=400, detail="Game not in progress")

    game_state = room["game_state"]

    if game_state["active_player_id"] != user["id"]:
        if body.type.value not in ("ASSIGN_ATTACK",):
            raise HTTPException(status_code=403, detail="Not your turn")

    new_state = apply_action(game_state, body.type.value, body.payload, user["id"])

    updates = {"game_state": new_state}
    if new_state.get("winner"):
        updates["status"] = "finished"

    sb.table("rooms").update(updates).eq("id", room["id"]).execute()

    _log_event(sb, room["id"], new_state["turn"], body.type.value.lower(), {
        "player_id": user["id"],
        **body.payload,
    })

    return {"ok": True, "game_state": new_state}


def _log_event(sb, room_id: str, turn: int, event_type: str, payload: dict):
    try:
        sb.table("event_log").insert({
            "room_id": room_id,
            "turn": turn,
            "event_type": event_type,
            "payload": payload,
        }).execute()
    except Exception:
        pass
