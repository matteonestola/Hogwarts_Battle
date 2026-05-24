from pydantic import BaseModel
from typing import Any, Literal, Optional
from enum import Enum


class RoomStatus(str, Enum):
    lobby = "lobby"
    playing = "playing"
    finished = "finished"


class CreateRoomRequest(BaseModel):
    adventure: int = 1
    language: Literal["it", "en"] = "it"


class JoinRoomRequest(BaseModel):
    pass


class AssignHeroesRequest(BaseModel):
    player_id: str
    heroes: list[str]


class GameActionType(str, Enum):
    play_card = "PLAY_CARD"
    assign_attack = "ASSIGN_ATTACK"
    buy_card = "BUY_CARD"
    end_phase = "END_PHASE"
    end_turn = "END_TURN"
    refresh_market = "REFRESH_MARKET"


class GameActionRequest(BaseModel):
    type: GameActionType
    payload: dict[str, Any] = {}


class ChatMessageRequest(BaseModel):
    content: str
