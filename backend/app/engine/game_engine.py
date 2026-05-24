import random
import copy
from .adventure_config import ADVENTURE_CONFIG, VILLAIN_DATA, LOCATION_DATA, CARD_DATA

HERO_START_DECKS = {
    "harry": ["alohomora"] * 7 + ["lev_wingardium"] * 3,
    "ron": ["alohomora"] * 7 + ["lev_wingardium"] * 3,
    "hermione": ["alohomora"] * 7 + ["lev_wingardium"] * 3,
    "neville": ["alohomora"] * 7 + ["lev_wingardium"] * 3,
}

HERO_HEALTH = {"harry": 10, "ron": 10, "hermione": 10, "neville": 10}


def _shuffle(lst):
    lst = list(lst)
    random.shuffle(lst)
    return lst


def build_initial_state(adventure: int, hero_assignments: dict) -> dict:
    config = ADVENTURE_CONFIG[adventure]

    villains = [copy.deepcopy(VILLAIN_DATA[v]) for v in config["villains"]]
    for v in villains:
        v["health_current"] = v["health_max"]

    locations = [copy.deepcopy(LOCATION_DATA[loc]) for loc in config["locations"]]

    market_deck = _shuffle(config["market_cards"] * 2)
    available = market_deck[:6]
    remaining = market_deck[6:]

    dark_arts_deck = _shuffle(config.get("dark_arts_cards", []) * 3)

    heroes = {}
    for hero_id, player_id in hero_assignments.items():
        deck = _shuffle(HERO_START_DECKS.get(hero_id, ["alohomora"] * 10))
        hand = deck[:5]
        heroes[hero_id] = {
            "player_id": player_id,
            "health": HERO_HEALTH.get(hero_id, 10),
            "health_max": HERO_HEALTH.get(hero_id, 10),
            "stunned": False,
            "deck": deck[5:],
            "hand": hand,
            "discard": [],
            "influence_tokens": 0,
            "attack_tokens": 0,
        }

    active_player_ids = list(hero_assignments.values())
    first_active = active_player_ids[0] if active_player_ids else None

    return {
        "adventure": adventure,
        "turn": 1,
        "active_player_id": first_active,
        "phase": "dark_arts",
        "locations": {
            "active_index": 0,
            "stack": locations,
            "control_tokens": {loc["id"]: 0 for loc in locations},
        },
        "villains": {
            "active": villains,
            "defeated": [],
        },
        "hogwarts_market": {
            "deck_count": len(remaining),
            "available": available,
            "deck": remaining,
        },
        "dark_arts_deck": {
            "deck_count": len(dark_arts_deck),
            "deck": dark_arts_deck,
            "discard": [],
        },
        "heroes": heroes,
        "turn_order": list(hero_assignments.keys()),
        "refresh_used": False,
        "winner": None,
    }


def apply_action(state: dict, action_type: str, payload: dict, player_id: str) -> dict:
    state = copy.deepcopy(state)

    if state["winner"]:
        return state

    if action_type == "PLAY_CARD":
        return _play_card(state, payload, player_id)
    elif action_type == "ASSIGN_ATTACK":
        return _assign_attack(state, payload, player_id)
    elif action_type == "BUY_CARD":
        return _buy_card(state, payload, player_id)
    elif action_type == "END_TURN":
        return _end_turn(state, player_id)
    elif action_type == "REFRESH_MARKET":
        return _refresh_market(state, player_id)
    elif action_type == "END_PHASE":
        return _end_phase(state, player_id)

    return state


def _get_active_hero_id(state, player_id):
    for hero_id, hero in state["heroes"].items():
        if hero["player_id"] == player_id:
            return hero_id
    return None


def _play_card(state, payload, player_id):
    hero_id = payload.get("hero_id") or _get_active_hero_id(state, player_id)
    card_id = payload.get("card_id")
    if not hero_id or not card_id:
        return state

    hero = state["heroes"].get(hero_id)
    if not hero or card_id not in hero["hand"]:
        return state

    hero["hand"].remove(card_id)
    hero["discard"].append(card_id)

    card = CARD_DATA.get(card_id, {})
    for effect in card.get("effects", []):
        _apply_effect(state, effect, hero_id)

    return _check_win_lose(state)


def _apply_effect(state, effect, hero_id):
    etype = effect["type"]
    val = effect["value"]
    hero = state["heroes"][hero_id]

    if etype == "influence":
        hero["influence_tokens"] = hero.get("influence_tokens", 0) + val
    elif etype == "attack":
        hero["attack_tokens"] = hero.get("attack_tokens", 0) + val
    elif etype == "draw":
        _draw_cards(state, hero_id, val)
    elif etype == "heal":
        hero["health"] = min(hero["health"] + val, hero["health_max"])
    elif etype == "damage_all":
        for h in state["heroes"].values():
            h["health"] = max(0, h["health"] - val)
            if h["health"] == 0:
                h["stunned"] = True
    elif etype == "control_token":
        active_loc = state["locations"]["stack"][state["locations"]["active_index"]]
        loc_id = active_loc["id"]
        state["locations"]["control_tokens"][loc_id] = (
            state["locations"]["control_tokens"].get(loc_id, 0) + val
        )


def _draw_cards(state, hero_id, count):
    hero = state["heroes"][hero_id]
    for _ in range(count):
        if not hero["deck"]:
            if not hero["discard"]:
                break
            hero["deck"] = _shuffle(hero["discard"])
            hero["discard"] = []
        if hero["deck"]:
            hero["hand"].append(hero["deck"].pop(0))


def _assign_attack(state, payload, player_id):
    villain_id = payload.get("villain_id")
    hero_id = _get_active_hero_id(state, player_id)
    if not hero_id or not villain_id:
        return state

    hero = state["heroes"][hero_id]
    if hero.get("attack_tokens", 0) <= 0:
        return state

    for villain in state["villains"]["active"]:
        if villain["id"] == villain_id:
            villain["health_current"] = max(0, villain["health_current"] - 1)
            hero["attack_tokens"] -= 1
            if villain["health_current"] == 0:
                state["villains"]["active"].remove(villain)
                state["villains"]["defeated"].append(villain)
            break

    return _check_win_lose(state)


def _buy_card(state, payload, player_id):
    card_id = payload.get("card_id")
    hero_id = _get_active_hero_id(state, player_id)
    if not hero_id or not card_id:
        return state

    hero = state["heroes"][hero_id]
    card = CARD_DATA.get(card_id, {})
    cost = card.get("cost", 0)

    if hero.get("influence_tokens", 0) < cost:
        return state

    if card_id not in state["hogwarts_market"]["available"]:
        return state

    hero["influence_tokens"] -= cost
    hero["discard"].append(card_id)
    state["hogwarts_market"]["available"].remove(card_id)

    deck = state["hogwarts_market"]["deck"]
    if deck:
        state["hogwarts_market"]["available"].append(deck.pop(0))
        state["hogwarts_market"]["deck_count"] = len(deck)

    return state


def _end_turn(state, player_id):
    hero_id = _get_active_hero_id(state, player_id)
    if not hero_id:
        return state

    hero = state["heroes"][hero_id]
    hero["discard"].extend(hero["hand"])
    hero["hand"] = []
    hero["influence_tokens"] = 0
    hero["attack_tokens"] = 0
    _draw_cards(state, hero_id, 5)

    turn_order = state["turn_order"]
    current_idx = turn_order.index(hero_id) if hero_id in turn_order else 0
    next_idx = (current_idx + 1) % len(turn_order)
    next_hero_id = turn_order[next_idx]
    next_player_id = state["heroes"][next_hero_id]["player_id"]

    state["active_player_id"] = next_player_id
    state["phase"] = "dark_arts"
    state["refresh_used"] = False

    if next_idx == 0:
        state["turn"] += 1

    return state


def _refresh_market(state, player_id):
    if state["refresh_used"]:
        return state

    hero_id = _get_active_hero_id(state, player_id)
    if not hero_id:
        return state

    hero = state["heroes"][hero_id]
    if hero.get("influence_tokens", 0) < 1:
        return state

    hero["influence_tokens"] -= 1

    deck = state["hogwarts_market"]["deck"]
    discarded = state["hogwarts_market"]["available"]
    state["hogwarts_market"]["available"] = deck[:6]
    state["hogwarts_market"]["deck"] = deck[6:] + _shuffle(discarded)
    state["hogwarts_market"]["deck_count"] = len(state["hogwarts_market"]["deck"])
    state["refresh_used"] = True

    return state


def _end_phase(state, player_id):
    phase_order = ["dark_arts", "villain", "actions", "end"]
    current = state.get("phase", "dark_arts")
    idx = phase_order.index(current) if current in phase_order else 0

    if idx < len(phase_order) - 1:
        state["phase"] = phase_order[idx + 1]

    if state["phase"] == "end":
        return _end_turn(state, player_id)

    return state


def _check_win_lose(state):
    all_stunned = all(h["stunned"] for h in state["heroes"].values())
    if all_stunned:
        state["winner"] = "villains"
        return state

    locations = state["locations"]
    active_loc = locations["stack"][locations["active_index"]]
    tokens = locations["control_tokens"].get(active_loc["id"], 0)
    if tokens >= active_loc.get("control_max", 3):
        locations["active_index"] += 1
        if locations["active_index"] >= len(locations["stack"]):
            state["winner"] = "villains"
            return state

    if not state["villains"]["active"] and not state["villains"]["defeated"]:
        state["winner"] = "heroes"

    config = ADVENTURE_CONFIG.get(state["adventure"], {})
    total_villains = len(config.get("villains", []))
    if len(state["villains"]["defeated"]) >= total_villains:
        state["winner"] = "heroes"

    return state
