# Hogwarts Battle – Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Hogwarts Battle digital board game from scaffolded skeleton to fully playable application across all 7 adventures, with realtime multiplayer, Google auth, IT/EN i18n, disconnection handling, and PWA support.

**Architecture:** React+Vite SPA (Vercel) communicates with FastAPI backend (Railway) via REST; game state is stored in Supabase `rooms.game_state` JSONB and propagated to all clients via Supabase Realtime WebSocket subscriptions. The backend is the sole authority on game state — frontend is purely presentational and never mutates state locally.

**Tech Stack:** React 18, Vite 5, TailwindCSS 3, Zustand, @supabase/supabase-js 2, react-i18next; FastAPI 0.111, Python 3.11, supabase-py 2.5, Pydantic 2; PostgreSQL on Supabase (eu-central-1, project `pbuqrdammoawbzjmtbyb`).

---

## Sprint A — Core Playable Game

### File Map

**Backend — modified:**
- `backend/app/engine/adventure_config.py` — complete card/villain/location data for adventures 1–2, stubs 3–7
- `backend/app/engine/game_engine.py` — phase auto-execution, stun recovery, bug fixes
- `backend/app/routes/game.py` — add GET /cards endpoint, card seeding
- `backend/app/main.py` — lifespan event for card seeding

**Backend — new:**
- `backend/tests/test_game_engine.py`
- `backend/tests/conftest.py`

**Frontend — modified:**
- `frontend/src/hooks/useChat.js` — fix room_id filter
- `frontend/src/hooks/useGameState.js` — pass room_id for Realtime filter
- `frontend/src/lib/api.js` — add `getCards(adventure)`
- `frontend/src/pages/Game.jsx` — call `loadCards` on mount
- `frontend/src/components/cards/Card.jsx` — read from cardStore
- `frontend/src/components/hero/HandCards.jsx` — read from cardStore
- `frontend/src/components/board/HogwartsMarket.jsx` — read from cardStore
- `frontend/src/store/gameStore.js` — store room_id alongside room

**Frontend — new:**
- `frontend/src/store/cardStore.js`
- `frontend/src/components/ui/Toast.jsx`
- `frontend/src/hooks/useToast.js`

---

### Task A1: Backend test setup

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_game_engine.py`

- [ ] **Step 1: Install pytest**

```
cd backend
pip install pytest pytest-asyncio httpx
```

- [ ] **Step 2: Create `backend/tests/__init__.py`**

Empty file.

- [ ] **Step 3: Create `backend/tests/conftest.py`**

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
```

- [ ] **Step 4: Create initial failing test in `backend/tests/test_game_engine.py`**

```python
from app.engine.game_engine import build_initial_state, apply_action

HERO_ASSIGNMENTS = {
    "harry": "player-1",
    "ron": "player-2",
}

def test_initial_state_has_correct_hero_count():
    state = build_initial_state(1, HERO_ASSIGNMENTS)
    assert len(state["heroes"]) == 2

def test_initial_state_phase_is_dark_arts():
    state = build_initial_state(1, HERO_ASSIGNMENTS)
    assert state["phase"] == "dark_arts"

def test_initial_state_heroes_have_5_cards():
    state = build_initial_state(1, HERO_ASSIGNMENTS)
    for hero in state["heroes"].values():
        assert len(hero["hand"]) == 5
```

- [ ] **Step 5: Run to confirm they pass (or fail with specific error about missing card)**

```
cd backend && python -m pytest tests/test_game_engine.py -v
```

Note current failures — expected `wingardium_leviosa` missing.

- [ ] **Step 6: Commit**

```bash
git add backend/tests/
git commit -m "test: add backend test scaffold"
```

---

### Task A2: Fix `lev_wingardium` → define `wingardium_leviosa`

**Files:**
- Modify: `backend/app/engine/adventure_config.py`
- Modify: `backend/app/engine/game_engine.py:6-9`

- [ ] **Step 1: Add `wingardium_leviosa` to CARD_DATA in `adventure_config.py`**

Add inside the `CARD_DATA` dict (after the `"flipendo"` entry):

```python
    "wingardium_leviosa": {
        "id": "wingardium_leviosa",
        "type": "hogwarts",
        "adventure": 1,
        "name_it": "Wingardium Leviosa",
        "name_en": "Wingardium Leviosa",
        "cost": 0,
        "effects": [{"type": "influence", "value": 1}],
        "ability_text_it": "Guadagna 1 🔮.",
        "ability_text_en": "Gain 1 🔮.",
    },
    "hogwarts_founders": {
        "id": "hogwarts_founders",
        "type": "hogwarts",
        "adventure": 1,
        "name_it": "Fondatori di Hogwarts",
        "name_en": "Hogwarts Founders",
        "cost": 6,
        "effects": [{"type": "influence", "value": 4}],
        "ability_text_it": "Guadagna 4 🔮.",
        "ability_text_en": "Gain 4 🔮.",
    },
    "polyjuice_potion": {
        "id": "polyjuice_potion",
        "type": "hogwarts",
        "adventure": 1,
        "name_it": "Pozione Polisucco",
        "name_en": "Polyjuice Potion",
        "cost": 4,
        "effects": [{"type": "draw", "value": 2}],
        "ability_text_it": "Pesca 2 carte.",
        "ability_text_en": "Draw 2 cards.",
    },
    "dobby": {
        "id": "dobby",
        "type": "hogwarts",
        "adventure": 1,
        "name_it": "Dobby",
        "name_en": "Dobby",
        "cost": 4,
        "effects": [{"type": "heal_any", "value": 2}],
        "ability_text_it": "Cura 2 salute a qualsiasi eroe.",
        "ability_text_en": "Heal 2 health to any hero.",
    },
    "chaos": {
        "id": "chaos",
        "type": "dark_arts",
        "adventure": 1,
        "name_it": "Caos",
        "name_en": "Chaos",
        "cost": 0,
        "effects": [{"type": "control_token", "value": 1}],
        "ability_text_it": "Aggiungi 1 token controllo al luogo attivo.",
        "ability_text_en": "Add 1 control token to the active location.",
    },
    "basilisk": {
        "id": "basilisk",
        "type": "dark_arts",
        "adventure": 1,
        "name_it": "Basilisco",
        "name_en": "Basilisk",
        "cost": 0,
        "effects": [{"type": "damage_active_hero", "value": 2}],
        "ability_text_it": "L'eroe attivo perde 2 salute.",
        "ability_text_en": "The active hero loses 2 health.",
    },
```

- [ ] **Step 2: Fix HERO_START_DECKS in `game_engine.py` lines 5–10**

```python
HERO_START_DECKS = {
    "harry":    ["alohomora"] * 7 + ["wingardium_leviosa"] * 3,
    "ron":      ["alohomora"] * 7 + ["wingardium_leviosa"] * 3,
    "hermione": ["alohomora"] * 7 + ["wingardium_leviosa"] * 3,
    "neville":  ["alohomora"] * 7 + ["wingardium_leviosa"] * 3,
}
```

- [ ] **Step 3: Run tests to confirm they pass**

```
cd backend && python -m pytest tests/test_game_engine.py -v
```

Expected: all 3 PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/app/engine/ backend/tests/
git commit -m "fix: replace lev_wingardium with wingardium_leviosa, add missing card data"
```

---

### Task A3: Fix win condition logic

**Files:**
- Modify: `backend/app/engine/game_engine.py:304`
- Modify: `backend/tests/test_game_engine.py`

- [ ] **Step 1: Add failing test**

In `test_game_engine.py`:

```python
def test_win_when_all_villains_defeated():
    state = build_initial_state(1, HERO_ASSIGNMENTS)
    # Defeat all villains manually
    defeated = state["villains"]["active"].copy()
    state["villains"]["defeated"] = defeated
    state["villains"]["active"] = []
    from app.engine.game_engine import _check_win_lose
    result = _check_win_lose(state)
    assert result["winner"] == "heroes"

def test_no_win_at_game_start():
    state = build_initial_state(1, HERO_ASSIGNMENTS)
    from app.engine.game_engine import _check_win_lose
    result = _check_win_lose(state)
    assert result["winner"] is None
```

- [ ] **Step 2: Run to confirm `test_no_win_at_game_start` fails (or `test_win_when_all_villains_defeated` fails)**

```
cd backend && python -m pytest tests/test_game_engine.py::test_no_win_at_game_start tests/test_game_engine.py::test_win_when_all_villains_defeated -v
```

- [ ] **Step 3: Fix `_check_win_lose` in `game_engine.py`**

Replace lines 304–311 with:

```python
    config = ADVENTURE_CONFIG.get(state["adventure"], {})
    total_villains = len(config.get("villains", []))
    if total_villains > 0 and len(state["villains"]["defeated"]) >= total_villains:
        state["winner"] = "heroes"

    return state
```

(Remove the `if not state["villains"]["active"] and not state["villains"]["defeated"]` block entirely.)

- [ ] **Step 4: Run tests**

```
cd backend && python -m pytest tests/test_game_engine.py -v
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine/game_engine.py backend/tests/test_game_engine.py
git commit -m "fix: correct win condition — heroes win when all villains defeated"
```

---

### Task A4: Add villain `attack_each_turn` config

**Files:**
- Modify: `backend/app/engine/adventure_config.py` (VILLAIN_DATA)

- [ ] **Step 1: Update VILLAIN_DATA with attack_each_turn**

Replace entire `VILLAIN_DATA` dict:

```python
VILLAIN_DATA = {
    "draco": {
        "id": "draco",
        "name_it": "Draco Malfoy",
        "name_en": "Draco Malfoy",
        "health_max": 6,
        "attack_tokens": 1,
        "attack_each_turn": [{"type": "control_token", "target": "active_location", "value": 1}],
        "ability_text_it": "Ogni turno: aggiungi 1 token controllo al luogo attivo.",
        "ability_text_en": "Each turn: add 1 control token to the active location.",
    },
    "quirrell": {
        "id": "quirrell",
        "name_it": "Professor Quirrell",
        "name_en": "Professor Quirrell",
        "health_max": 7,
        "attack_tokens": 2,
        "attack_each_turn": [{"type": "damage", "target": "active_hero", "value": 1}],
        "ability_text_it": "Ogni turno: l'eroe attivo perde 1 salute.",
        "ability_text_en": "Each turn: the active hero loses 1 health.",
    },
    "lucius": {
        "id": "lucius",
        "name_it": "Lucius Malfoy",
        "name_en": "Lucius Malfoy",
        "health_max": 9,
        "attack_tokens": 2,
        "attack_each_turn": [
            {"type": "control_token", "target": "active_location", "value": 1},
            {"type": "damage", "target": "all_heroes", "value": 1},
        ],
        "ability_text_it": "Ogni turno: aggiungi 1 token controllo e infliggi 1 danno a tutti.",
        "ability_text_en": "Each turn: add 1 control token and deal 1 damage to all heroes.",
    },
    "bellatrix": {
        "id": "bellatrix",
        "name_it": "Bellatrix Lestrange",
        "name_en": "Bellatrix Lestrange",
        "health_max": 9,
        "attack_tokens": 2,
        "attack_each_turn": [{"type": "damage", "target": "all_heroes", "value": 2}],
        "ability_text_it": "Ogni turno: tutti gli eroi perdono 2 salute.",
        "ability_text_en": "Each turn: all heroes lose 2 health.",
    },
    "fenrir": {
        "id": "fenrir",
        "name_it": "Fenrir Grayback",
        "name_en": "Fenrir Greyback",
        "health_max": 8,
        "attack_tokens": 2,
        "attack_each_turn": [{"type": "damage", "target": "random_hero", "value": 3}],
        "ability_text_it": "Ogni turno: un eroe casuale perde 3 salute.",
        "ability_text_en": "Each turn: a random hero loses 3 health.",
    },
    "dolohov": {
        "id": "dolohov",
        "name_it": "Antonin Dolohov",
        "name_en": "Antonin Dolohov",
        "health_max": 7,
        "attack_tokens": 1,
        "attack_each_turn": [{"type": "discard", "target": "active_hero", "value": 1}],
        "ability_text_it": "Ogni turno: l'eroe attivo scarta 1 carta.",
        "ability_text_en": "Each turn: the active hero discards 1 card.",
    },
    "voldemort_a4": {
        "id": "voldemort_a4",
        "name_it": "Voldemort",
        "name_en": "Voldemort",
        "health_max": 12,
        "attack_tokens": 3,
        "attack_each_turn": [
            {"type": "damage", "target": "all_heroes", "value": 1},
            {"type": "control_token", "target": "active_location", "value": 1},
        ],
        "ability_text_it": "Ogni turno: 1 danno a tutti + 1 token controllo.",
        "ability_text_en": "Each turn: 1 damage to all + 1 control token.",
    },
    "umbridge": {
        "id": "umbridge",
        "name_it": "Dolores Umbridge",
        "name_en": "Dolores Umbridge",
        "health_max": 8,
        "attack_tokens": 2,
        "attack_each_turn": [{"type": "detain", "target": "active_hero", "value": 1}],
        "ability_text_it": "Ogni turno: l'eroe attivo non può comprare carte questo turno.",
        "ability_text_en": "Each turn: the active hero cannot buy cards this turn.",
    },
    "nagini": {
        "id": "nagini",
        "name_it": "Nagini",
        "name_en": "Nagini",
        "health_max": 6,
        "attack_tokens": 1,
        "attack_each_turn": [{"type": "damage", "target": "active_hero", "value": 2}],
        "ability_text_it": "Ogni turno: l'eroe attivo perde 2 salute.",
        "ability_text_en": "Each turn: the active hero loses 2 health.",
    },
    "voldemort_final": {
        "id": "voldemort_final",
        "name_it": "Lord Voldemort",
        "name_en": "Lord Voldemort",
        "health_max": 15,
        "attack_tokens": 3,
        "attack_each_turn": [
            {"type": "damage", "target": "all_heroes", "value": 2},
            {"type": "control_token", "target": "active_location", "value": 2},
        ],
        "ability_text_it": "Ogni turno: 2 danni a tutti + 2 token controllo.",
        "ability_text_en": "Each turn: 2 damage to all + 2 control tokens.",
    },
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/engine/adventure_config.py
git commit -m "feat: add villain attack_each_turn config for all adventures"
```

---

### Task A5: Implement phase auto-execution in `END_PHASE`

**Files:**
- Modify: `backend/app/engine/game_engine.py`
- Modify: `backend/tests/test_game_engine.py`

- [ ] **Step 1: Add failing tests for phase auto-execution**

In `test_game_engine.py`:

```python
def test_end_phase_dark_arts_auto_applies_effects():
    state = build_initial_state(1, HERO_ASSIGNMENTS)
    assert state["phase"] == "dark_arts"
    initial_deck_count = len(state["dark_arts_deck"]["deck"])
    new_state = apply_action(state, "END_PHASE", {}, "player-1")
    # Phase advanced to villain
    assert new_state["phase"] == "villain"
    # Dark arts cards were drawn (adventure 1 has dark_arts_count=1)
    assert len(new_state["dark_arts_deck"]["deck"]) == initial_deck_count - 1
    assert len(new_state["dark_arts_deck"]["discard"]) == 1

def test_end_phase_villain_auto_applies_attacks():
    state = build_initial_state(1, HERO_ASSIGNMENTS)
    state["phase"] = "villain"
    # Draco's attack adds control token — grab initial count
    active_loc_id = state["locations"]["stack"][state["locations"]["active_index"]]["id"]
    initial_tokens = state["locations"]["control_tokens"][active_loc_id]
    new_state = apply_action(state, "END_PHASE", {}, "player-1")
    assert new_state["phase"] == "actions"
    # Draco + Quirrell both active; Draco adds control token
    assert new_state["locations"]["control_tokens"][active_loc_id] > initial_tokens

def test_end_phase_actions_ends_turn():
    state = build_initial_state(1, HERO_ASSIGNMENTS)
    state["phase"] = "actions"
    new_state = apply_action(state, "END_PHASE", {}, "player-1")
    # Turn ended: new active player
    assert new_state["active_player_id"] != "player-1" or new_state["phase"] == "dark_arts"
```

- [ ] **Step 2: Run to confirm they fail**

```
cd backend && python -m pytest tests/test_game_engine.py::test_end_phase_dark_arts_auto_applies_effects tests/test_game_engine.py::test_end_phase_villain_auto_applies_attacks -v
```

- [ ] **Step 3: Add `_resolve_dark_arts_phase` to `game_engine.py`**

Add after the `_end_phase` function:

```python
def _resolve_dark_arts_phase(state: dict) -> dict:
    from .adventure_config import ADVENTURE_CONFIG, CARD_DATA
    count = ADVENTURE_CONFIG.get(state["adventure"], {}).get("dark_arts_count", 1)
    deck = state["dark_arts_deck"]["deck"]
    discard = state["dark_arts_deck"]["discard"]

    for _ in range(count):
        if not deck:
            deck = _shuffle(discard)
            discard = []
        if deck:
            card_id = deck.pop(0)
            discard.append(card_id)
            card = CARD_DATA.get(card_id, {})
            active_hero_id = _get_active_hero_id(state, state["active_player_id"])
            for effect in card.get("effects", []):
                _apply_dark_arts_effect(state, effect, active_hero_id)

    state["dark_arts_deck"]["deck"] = deck
    state["dark_arts_deck"]["discard"] = discard
    state["dark_arts_deck"]["deck_count"] = len(deck)
    return state


def _apply_dark_arts_effect(state: dict, effect: dict, active_hero_id: str) -> None:
    etype = effect["type"]
    val = effect["value"]

    if etype == "damage_all":
        for h in state["heroes"].values():
            h["health"] = max(0, h["health"] - val)
            if h["health"] == 0:
                h["stunned"] = True
    elif etype == "damage_active_hero" and active_hero_id:
        hero = state["heroes"].get(active_hero_id)
        if hero:
            hero["health"] = max(0, hero["health"] - val)
            if hero["health"] == 0:
                hero["stunned"] = True
    elif etype == "control_token":
        idx = state["locations"]["active_index"]
        active_loc = state["locations"]["stack"][idx]
        loc_id = active_loc["id"]
        state["locations"]["control_tokens"][loc_id] = (
            state["locations"]["control_tokens"].get(loc_id, 0) + val
        )


def _resolve_villain_phase(state: dict) -> dict:
    active_hero_id = _get_active_hero_id(state, state["active_player_id"])
    hero_ids = list(state["heroes"].keys())

    for villain in state["villains"]["active"]:
        for attack in villain.get("attack_each_turn", []):
            _apply_villain_attack(state, attack, active_hero_id, hero_ids)

    return state


def _apply_villain_attack(state: dict, attack: dict, active_hero_id: str, hero_ids: list) -> None:
    atype = attack["type"]
    target = attack["target"]
    val = attack["value"]

    if atype == "control_token" and target == "active_location":
        idx = state["locations"]["active_index"]
        active_loc = state["locations"]["stack"][idx]
        loc_id = active_loc["id"]
        state["locations"]["control_tokens"][loc_id] = (
            state["locations"]["control_tokens"].get(loc_id, 0) + val
        )
    elif atype == "damage":
        if target == "active_hero" and active_hero_id:
            hero = state["heroes"].get(active_hero_id)
            if hero:
                hero["health"] = max(0, hero["health"] - val)
                if hero["health"] == 0:
                    hero["stunned"] = True
        elif target == "all_heroes":
            for h in state["heroes"].values():
                h["health"] = max(0, h["health"] - val)
                if h["health"] == 0:
                    h["stunned"] = True
        elif target == "random_hero" and hero_ids:
            import random
            chosen = random.choice(hero_ids)
            hero = state["heroes"].get(chosen)
            if hero:
                hero["health"] = max(0, hero["health"] - val)
                if hero["health"] == 0:
                    hero["stunned"] = True
    elif atype == "discard" and target == "active_hero" and active_hero_id:
        hero = state["heroes"].get(active_hero_id)
        if hero and hero["hand"]:
            discarded = hero["hand"].pop(0)
            hero["discard"].append(discarded)
    elif atype == "detain" and target == "active_hero":
        if active_hero_id and active_hero_id in state["heroes"]:
            state["heroes"][active_hero_id]["detained"] = True
```

- [ ] **Step 4: Update `_end_phase` to call resolution functions**

Replace the entire `_end_phase` function:

```python
def _end_phase(state: dict, player_id: str) -> dict:
    current = state.get("phase", "dark_arts")

    if current == "dark_arts":
        state = _resolve_dark_arts_phase(state)
        state["phase"] = "villain"
    elif current == "villain":
        state = _resolve_villain_phase(state)
        state = _check_win_lose(state)
        if not state["winner"]:
            state["phase"] = "actions"
    elif current in ("actions", "end"):
        state = _end_turn(state, player_id)

    return state
```

- [ ] **Step 5: Run tests**

```
cd backend && python -m pytest tests/test_game_engine.py -v
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/engine/game_engine.py backend/tests/test_game_engine.py
git commit -m "feat: implement phase auto-execution (dark arts + villain attack)"
```

---

### Task A6: Implement stun recovery

**Files:**
- Modify: `backend/app/engine/game_engine.py`
- Modify: `backend/tests/test_game_engine.py`

- [ ] **Step 1: Add failing test**

```python
def test_stunned_hero_recovers_next_turn():
    state = build_initial_state(1, {"harry": "player-1"})
    state["heroes"]["harry"]["health"] = 0
    state["heroes"]["harry"]["stunned"] = True
    state["phase"] = "actions"
    # End turn for Harry (stunned) — should recover
    new_state = apply_action(state, "END_PHASE", {}, "player-1")
    assert new_state["heroes"]["harry"]["stunned"] is False
    assert new_state["heroes"]["harry"]["health"] == 1
    assert len(new_state["heroes"]["harry"]["hand"]) == 5
```

- [ ] **Step 2: Update `_end_turn` to handle stun recovery**

Replace the existing `_end_turn` function:

```python
def _end_turn(state: dict, player_id: str) -> dict:
    hero_id = _get_active_hero_id(state, player_id)
    if not hero_id:
        return state

    hero = state["heroes"][hero_id]

    # Stun recovery: restore health to 1, draw fresh hand, clear stun
    if hero.get("stunned"):
        hero["discard"].extend(hero["hand"])
        hero["hand"] = []
        hero["stunned"] = False
        hero["health"] = 1
        hero["influence_tokens"] = 0
        hero["attack_tokens"] = hero.get("detained", False) and 0 or 0
        hero.pop("detained", None)
        _draw_cards(state, hero_id, 5)
    else:
        hero["discard"].extend(hero["hand"])
        hero["hand"] = []
        hero["influence_tokens"] = 0
        hero["attack_tokens"] = 0
        hero.pop("detained", None)
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
```

- [ ] **Step 3: Run tests**

```
cd backend && python -m pytest tests/test_game_engine.py -v
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/app/engine/game_engine.py backend/tests/test_game_engine.py
git commit -m "feat: stun recovery — hero restores to 1hp and draws 5 on recovery turn"
```

---

### Task A7: Cards API endpoint + DB seeding

**Files:**
- Modify: `backend/app/routes/game.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Add `seed_cards` function and GET /cards to `game.py`**

Add at the top of `game.py` after existing imports:

```python
from ..engine.adventure_config import CARD_DATA
```

Add `seed_cards` function and new route anywhere in the file:

```python
def seed_cards(sb) -> None:
    rows = [
        {
            "id": c["id"],
            "type": c.get("type", "hogwarts"),
            "adventure": c.get("adventure", 1),
            "name_it": c.get("name_it", c["id"]),
            "name_en": c.get("name_en", c["id"]),
            "cost": c.get("cost", 0),
            "effects": c.get("effects", []),
            "ability_text_it": c.get("ability_text_it"),
            "ability_text_en": c.get("ability_text_en"),
            "image_url": c.get("image_url"),
        }
        for c in CARD_DATA.values()
    ]
    # Upsert — insert or update on conflict
    sb.table("cards").upsert(rows, on_conflict="id").execute()


@router.get("/cards")
async def get_cards(
    adventure: int = 1,
    sb=Depends(get_supabase),
):
    res = sb.table("cards").select("*").lte("adventure", adventure).execute()
    return res.data or []
```

Note: the route path is `/rooms/cards` due to the prefix. Fix by registering it separately in `main.py`.

- [ ] **Step 2: Move GET /cards to its own router in `game.py`**

Add a second router at the top of `game.py`:

```python
cards_router = APIRouter()

@cards_router.get("")
async def get_cards(
    adventure: int = 1,
    sb=Depends(get_supabase),
):
    res = sb.table("cards").select("*").lte("adventure", adventure).execute()
    return res.data or []
```

- [ ] **Step 3: Register routes and lifespan in `main.py`**

Replace the entire `main.py`:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import rooms, game, chat
from .auth import get_supabase


@asynccontextmanager
async def lifespan(app: FastAPI):
    sb = get_supabase()
    from .routes.game import seed_cards
    seed_cards(sb)
    yield


app = FastAPI(title="Hogwarts Battle API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
app.include_router(game.router, prefix="/rooms", tags=["game"])
app.include_router(game.cards_router, prefix="/cards", tags=["cards"])
app.include_router(chat.router, prefix="/rooms", tags=["chat"])


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Test endpoint manually**

Start server: `cd backend && uvicorn app.main:app --reload`

Visit `http://localhost:8000/cards?adventure=1` — should return array of card objects.

- [ ] **Step 5: Commit**

```bash
git add backend/app/routes/game.py backend/app/main.py
git commit -m "feat: cards API endpoint + DB seed on startup"
```

---

### Task A8: Frontend card store

**Files:**
- Create: `frontend/src/store/cardStore.js`
- Modify: `frontend/src/lib/api.js`

- [ ] **Step 1: Add `getCards` to `api.js`**

Add to the `api` object in `frontend/src/lib/api.js`:

```javascript
  getCards: (adventure = 1) =>
    request('GET', `/cards?adventure=${adventure}`),
```

- [ ] **Step 2: Create `frontend/src/store/cardStore.js`**

```javascript
import { create } from 'zustand'
import { api } from '../lib/api'

export const useCardStore = create((set, get) => ({
  cards: {},
  loaded: false,

  loadCards: async (adventure = 1) => {
    if (get().loaded) return
    try {
      const list = await api.getCards(adventure)
      const map = {}
      list.forEach((c) => { map[c.id] = c })
      set({ cards: map, loaded: true })
    } catch {
      // non-fatal: components fall back to showing card ID
    }
  },

  get: (cardId) => {
    const c = get().cards[cardId]
    return c || { id: cardId, name_it: cardId, name_en: cardId, cost: 0, effects: [] }
  },
}))
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/cardStore.js frontend/src/lib/api.js
git commit -m "feat: frontend card catalog store with lazy loading"
```

---

### Task A9: Wire card store into frontend components

**Files:**
- Modify: `frontend/src/pages/Game.jsx`
- Modify: `frontend/src/components/cards/Card.jsx`
- Modify: `frontend/src/components/hero/HandCards.jsx`
- Modify: `frontend/src/components/board/HogwartsMarket.jsx`
- Modify: `frontend/src/store/gameStore.js`

- [ ] **Step 1: Store `room_id` in gameStore**

In `frontend/src/store/gameStore.js`, update `setRoom` to also expose `roomId`:

```javascript
import { create } from 'zustand'

export const useGameStore = create((set) => ({
  room: null,
  roomId: null,
  gameState: null,
  chatMessages: [],
  eventLog: [],

  setRoom: (room) => set({ room, roomId: room?.id ?? null }),
  setGameState: (gameState) => set({ gameState }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  addEventLog: (event) => set((s) => ({ eventLog: [...s.eventLog, event] })),
  setEventLog: (eventLog) => set({ eventLog }),
  reset: () => set({ room: null, roomId: null, gameState: null, chatMessages: [], eventLog: [] }),
}))
```

- [ ] **Step 2: Call `loadCards` in `Game.jsx` on mount**

In `frontend/src/pages/Game.jsx`, add to imports:

```javascript
import { useCardStore } from '../store/cardStore'
```

Inside the component, add after other store destructures:

```javascript
const { loadCards } = useCardStore()
```

Add to the `useEffect` that fetches room data:

```javascript
useEffect(() => {
  if (!roomCode) return
  api.getRoom(roomCode).then((r) => {
    setRoom(r)
    setGameState(r.game_state)
    if (r.game_state?.adventure) {
      loadCards(r.game_state.adventure)
    }
  })
  api.getChat(roomCode).then(setChatMessages)
}, [roomCode])
```

- [ ] **Step 3: Update `Card.jsx` to read from cardStore**

Replace the entire `frontend/src/components/cards/Card.jsx`:

```javascript
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCardStore } from '../../store/cardStore'
import CardDetail from './CardDetail'

const TYPE_COLORS = {
  hogwarts: 'border-hogwarts-gold/60 bg-hogwarts-gold/10',
  dark_arts: 'border-purple-700/60 bg-purple-900/20',
  villain: 'border-red-700/60 bg-red-900/20',
  location: 'border-blue-700/60 bg-blue-900/20',
  hero: 'border-green-700/60 bg-green-900/20',
}

export default function Card({ cardId, onClick, disabled, showBuy }) {
  const { i18n } = useTranslation()
  const { get } = useCardStore()
  const [showDetail, setShowDetail] = useState(false)
  const lang = i18n.language

  const cardData = get(cardId)
  const name = cardData[`name_${lang}`] || cardData.name_it || cardId
  const colorClass = TYPE_COLORS[cardData?.type] || TYPE_COLORS.hogwarts

  return (
    <>
      <div
        className={`relative aspect-[2/3] rounded border ${colorClass} cursor-pointer transition-transform hover:scale-105 hover:z-10 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } flex flex-col items-center justify-center p-1`}
        onClick={() => { if (!disabled) setShowDetail(true) }}
      >
        {cardData.image_url ? (
          <img src={cardData.image_url} alt={name} className="w-full h-full object-cover rounded" />
        ) : (
          <div className="text-center">
            <div className="text-xs font-semibold text-hogwarts-parchment leading-tight line-clamp-2">{name}</div>
            {cardData.cost != null && (
              <div className="mt-1 text-xs text-hogwarts-gold">🔮{cardData.cost}</div>
            )}
          </div>
        )}
      </div>

      {showDetail && (
        <CardDetail
          cardData={cardData}
          cardId={cardId}
          onClose={() => setShowDetail(false)}
          onAction={onClick}
          showBuy={showBuy}
        />
      )}
    </>
  )
}
```

- [ ] **Step 4: Update `HandCards.jsx` — remove cardData prop, use store**

Replace `frontend/src/components/hero/HandCards.jsx`:

```javascript
import { useTranslation } from 'react-i18next'
import Card from '../cards/Card'

export default function HandCards({ cards, onPlay }) {
  const { t } = useTranslation()

  if (!cards.length) return (
    <div className="text-xs text-hogwarts-parchment/30 py-1">{t('game.hand')}: vuota</div>
  )

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {cards.map((cardId) => (
        <div key={cardId} className="flex-shrink-0 w-10">
          <Card cardId={cardId} onClick={() => onPlay(cardId)} showBuy={false} />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Update `HogwartsMarket.jsx`**

Replace `frontend/src/components/board/HogwartsMarket.jsx`:

```javascript
import { useTranslation } from 'react-i18next'
import Card from '../cards/Card'

export default function HogwartsMarket({ market, onBuy, disabled }) {
  const { t } = useTranslation()

  return (
    <div className="bg-hogwarts-dark/50 border border-hogwarts-gold/20 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-hogwarts-gold/60">🃏 {t('game.market')}</div>
        <span className="text-xs text-hogwarts-parchment/40">Mazzo: {market?.deck_count ?? 0}</span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {(market?.available || []).map((cardId) => (
          <Card
            key={cardId}
            cardId={cardId}
            onClick={() => onBuy(cardId)}
            disabled={disabled}
            showBuy
          />
        ))}
        {Array.from({ length: Math.max(0, 6 - (market?.available?.length || 0)) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-[2/3] bg-hogwarts-dark/30 border border-dashed border-hogwarts-parchment/10 rounded" />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/store/gameStore.js frontend/src/store/cardStore.js frontend/src/pages/Game.jsx frontend/src/components/cards/Card.jsx frontend/src/components/hero/HandCards.jsx frontend/src/components/board/HogwartsMarket.jsx frontend/src/lib/api.js
git commit -m "feat: wire card catalog store into all card-displaying components"
```

---

### Task A10: Fix Realtime subscriptions (wrong filter columns)

**Files:**
- Modify: `frontend/src/hooks/useChat.js`
- Modify: `frontend/src/hooks/useGameState.js`

- [ ] **Step 1: Fix `useChat.js`**

`chat_messages` and `event_log` have `room_id` (UUID), not `room_code`. The hook must receive `roomId` (UUID), not `roomCode`.

Replace entire `frontend/src/hooks/useChat.js`:

```javascript
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export function useChat(roomId) {
  const { addChatMessage, addEventLog } = useGameStore()

  useEffect(() => {
    if (!roomId) return

    const chatChannel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => addChatMessage(payload.new)
      )
      .subscribe()

    const logChannel = supabase
      .channel(`log:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_log', filter: `room_id=eq.${roomId}` },
        (payload) => addEventLog(payload.new)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(logChannel)
    }
  }, [roomId, addChatMessage, addEventLog])
}
```

- [ ] **Step 2: Fix `useGameState.js`**

Replace entire `frontend/src/hooks/useGameState.js`:

```javascript
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'

export function useGameState(roomId) {
  const { setGameState, setRoom } = useGameStore()

  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`state:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoom(payload.new)
          setGameState(payload.new.game_state)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [roomId, setGameState, setRoom])
}
```

- [ ] **Step 3: Update `Game.jsx` to pass `roomId` (UUID) instead of `roomCode`**

In `frontend/src/pages/Game.jsx`, change hook calls:

```javascript
const { room, gameState, roomId, setRoom, setGameState, setChatMessages, setEventLog } = useGameStore()

// Change hook calls from roomCode to roomId
useGameState(roomId)
useChat(roomId)
```

The `roomId` is set via `setRoom(r)` which now stores `r.id`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useChat.js frontend/src/hooks/useGameState.js frontend/src/pages/Game.jsx
git commit -m "fix: Realtime subscriptions use room_id (UUID) not room_code"
```

---

### Task A11: Toast error system

**Files:**
- Create: `frontend/src/hooks/useToast.js`
- Create: `frontend/src/components/ui/Toast.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `useToast.js`**

```javascript
import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'error') => {
    const id = Date.now()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
}))

export const toast = {
  error: (msg) => useToastStore.getState().addToast(msg, 'error'),
  success: (msg) => useToastStore.getState().addToast(msg, 'success'),
}
```

- [ ] **Step 2: Create `Toast.jsx`**

```javascript
import { useToastStore } from '../../hooks/useToast'

export default function Toast() {
  const { toasts } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all ${
            t.type === 'error'
              ? 'bg-red-900/90 border border-red-700 text-red-100'
              : 'bg-green-900/90 border border-green-700 text-green-100'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Add Toast to `App.jsx`**

In `frontend/src/App.jsx`, import and render:

```javascript
import Toast from './components/ui/Toast'

// Inside return, add before closing tag:
<Toast />
```

- [ ] **Step 4: Use toast in Game.jsx for API errors**

In `frontend/src/pages/Game.jsx`, import and use:

```javascript
import { toast } from '../hooks/useToast'

// Replace bare try/catch in sendAction:
const sendAction = async (type, payload = {}) => {
  try {
    await api.sendAction(roomCode, type, payload)
  } catch (e) {
    toast.error(e.message)
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useToast.js frontend/src/components/ui/Toast.jsx frontend/src/App.jsx frontend/src/pages/Game.jsx
git commit -m "feat: toast error notifications for API failures"
```

---

### Task A12: Complete adventure 1 & 2 data, add stubs for 3–7

**Files:**
- Modify: `backend/app/engine/adventure_config.py`

- [ ] **Step 1: Complete ADVENTURE_CONFIG for adventures 1–7**

Replace the entire `ADVENTURE_CONFIG` dict:

```python
ADVENTURE_CONFIG = {
    1: {
        "villains": ["draco", "quirrell"],
        "dark_arts_count": 1,
        "locations": ["diagon_alley", "leaky_cauldron", "hogwarts_castle"],
        "market_cards": [
            "alohomora", "incendio", "lumos", "reparo", "expelliarmus",
            "bertie_botts", "nimbus_2000", "hogwarts_founders",
        ],
        "dark_arts_cards": ["flipendo", "expulso", "chaos"],
    },
    2: {
        "villains": ["draco", "quirrell", "lucius"],
        "dark_arts_count": 2,
        "locations": ["diagon_alley", "leaky_cauldron", "chamber_of_secrets", "hogwarts_castle"],
        "market_cards": [
            "alohomora", "incendio", "lumos", "reparo", "expelliarmus",
            "bertie_botts", "nimbus_2000", "hogwarts_founders",
            "polyjuice_potion", "dobby",
        ],
        "dark_arts_cards": ["flipendo", "expulso", "chaos", "basilisk"],
    },
    3: {
        "villains": ["bellatrix", "fenrir", "dolohov"],
        "dark_arts_count": 2,
        "locations": ["diagon_alley", "leaky_cauldron", "azkaban", "hogwarts_castle"],
        "market_cards": [
            "alohomora", "incendio", "lumos", "reparo", "expelliarmus",
            "bertie_botts", "nimbus_2000", "hogwarts_founders",
            "polyjuice_potion", "dobby", "felix_felicis",
        ],
        "dark_arts_cards": ["flipendo", "expulso", "chaos", "basilisk", "dementor"],
    },
    4: {
        "villains": ["lucius", "bellatrix", "voldemort_a4"],
        "dark_arts_count": 2,
        "locations": ["ministry_of_magic", "diagon_alley", "azkaban", "hogwarts_castle"],
        "market_cards": [
            "alohomora", "incendio", "lumos", "reparo", "expelliarmus",
            "bertie_botts", "nimbus_2000", "hogwarts_founders",
            "polyjuice_potion", "dobby", "felix_felicis", "golden_snitch",
        ],
        "dark_arts_cards": ["flipendo", "expulso", "chaos", "basilisk", "dementor", "avada_kedavra"],
    },
    5: {
        "villains": ["umbridge", "bellatrix", "voldemort_a4"],
        "dark_arts_count": 2,
        "locations": ["ministry_of_magic", "diagon_alley", "department_of_mysteries", "hogwarts_castle"],
        "market_cards": [
            "alohomora", "incendio", "lumos", "reparo", "expelliarmus",
            "bertie_botts", "nimbus_2000", "hogwarts_founders",
            "polyjuice_potion", "dobby", "felix_felicis", "golden_snitch", "order_of_phoenix",
        ],
        "dark_arts_cards": ["flipendo", "expulso", "chaos", "basilisk", "dementor", "avada_kedavra"],
    },
    6: {
        "villains": ["bellatrix", "fenrir", "voldemort_a4"],
        "dark_arts_count": 3,
        "locations": ["ministry_of_magic", "hogwarts_castle", "azkaban", "department_of_mysteries"],
        "market_cards": [
            "alohomora", "incendio", "lumos", "reparo", "expelliarmus",
            "bertie_botts", "nimbus_2000", "hogwarts_founders",
            "polyjuice_potion", "dobby", "felix_felicis", "golden_snitch",
            "order_of_phoenix", "deathly_hallows",
        ],
        "dark_arts_cards": ["flipendo", "expulso", "chaos", "basilisk", "dementor", "avada_kedavra"],
        "special_rules": ["horcrux_tracker"],
        "horcrux_count": 6,
    },
    7: {
        "villains": ["nagini", "bellatrix", "voldemort_final"],
        "dark_arts_count": 3,
        "locations": ["ministry_of_magic", "hogwarts_castle", "azkaban", "department_of_mysteries"],
        "market_cards": [
            "alohomora", "incendio", "lumos", "reparo", "expelliarmus",
            "bertie_botts", "nimbus_2000", "hogwarts_founders",
            "polyjuice_potion", "dobby", "felix_felicis", "golden_snitch",
            "order_of_phoenix", "deathly_hallows",
        ],
        "dark_arts_cards": ["flipendo", "expulso", "chaos", "basilisk", "dementor", "avada_kedavra"],
        "special_rules": ["horcrux_tracker"],
        "horcrux_count": 7,
    },
}
```

- [ ] **Step 2: Add missing LOCATION_DATA entries**

Add to `LOCATION_DATA`:

```python
    "azkaban": {
        "id": "azkaban",
        "name_it": "Azkaban",
        "name_en": "Azkaban",
        "control_max": 3,
        "penalty_text_it": "Ogni token controllo riduce di 1 la salute massima degli eroi.",
        "penalty_text_en": "Each control token reduces heroes' max health by 1.",
    },
    "ministry_of_magic": {
        "id": "ministry_of_magic",
        "name_it": "Ministero della Magia",
        "name_en": "Ministry of Magic",
        "control_max": 4,
        "penalty_text_it": "Ogni token controllo rimuove 1 carta dal mercato.",
        "penalty_text_en": "Each control token removes 1 card from the market.",
    },
    "department_of_mysteries": {
        "id": "department_of_mysteries",
        "name_it": "Dipartimento dei Misteri",
        "name_en": "Department of Mysteries",
        "control_max": 4,
        "penalty_text_it": "Ogni turno: pesca una carta profezia — effetti variabili.",
        "penalty_text_en": "Each turn: draw a prophecy card — variable effects.",
    },
```

- [ ] **Step 3: Add missing CARD_DATA entries**

Add to `CARD_DATA`:

```python
    "felix_felicis": {
        "id": "felix_felicis",
        "type": "hogwarts",
        "adventure": 3,
        "name_it": "Felix Felicis",
        "name_en": "Felix Felicis",
        "cost": 6,
        "effects": [{"type": "influence", "value": 2}, {"type": "draw", "value": 2}],
        "ability_text_it": "Guadagna 2 🔮 e pesca 2 carte.",
        "ability_text_en": "Gain 2 🔮 and draw 2 cards.",
    },
    "golden_snitch": {
        "id": "golden_snitch",
        "type": "hogwarts",
        "adventure": 4,
        "name_it": "Boccino d'Oro",
        "name_en": "Golden Snitch",
        "cost": 7,
        "effects": [{"type": "influence", "value": 3}, {"type": "attack", "value": 1}],
        "ability_text_it": "Guadagna 3 🔮 e 1 ⚔️.",
        "ability_text_en": "Gain 3 🔮 and 1 ⚔️.",
    },
    "order_of_phoenix": {
        "id": "order_of_phoenix",
        "type": "hogwarts",
        "adventure": 5,
        "name_it": "Ordine della Fenice",
        "name_en": "Order of the Phoenix",
        "cost": 6,
        "effects": [{"type": "heal_any", "value": 3}, {"type": "attack", "value": 1}],
        "ability_text_it": "Cura 3 salute a qualsiasi eroe e guadagna 1 ⚔️.",
        "ability_text_en": "Heal 3 health to any hero and gain 1 ⚔️.",
    },
    "deathly_hallows": {
        "id": "deathly_hallows",
        "type": "hogwarts",
        "adventure": 6,
        "name_it": "Doni della Morte",
        "name_en": "Deathly Hallows",
        "cost": 8,
        "effects": [{"type": "influence", "value": 3}, {"type": "attack", "value": 2}, {"type": "draw", "value": 1}],
        "ability_text_it": "Guadagna 3 🔮, 2 ⚔️, pesca 1 carta.",
        "ability_text_en": "Gain 3 🔮, 2 ⚔️, draw 1 card.",
    },
    "dementor": {
        "id": "dementor",
        "type": "dark_arts",
        "adventure": 3,
        "name_it": "Dissennatore",
        "name_en": "Dementor",
        "cost": 0,
        "effects": [{"type": "damage_all", "value": 2}],
        "ability_text_it": "Ogni eroe perde 2 salute.",
        "ability_text_en": "Each hero loses 2 health.",
    },
    "avada_kedavra": {
        "id": "avada_kedavra",
        "type": "dark_arts",
        "adventure": 4,
        "name_it": "Avada Kedavra",
        "name_en": "Avada Kedavra",
        "cost": 0,
        "effects": [{"type": "damage_active_hero", "value": 4}],
        "ability_text_it": "L'eroe attivo perde 4 salute.",
        "ability_text_en": "The active hero loses 4 health.",
    },
```

- [ ] **Step 4: Handle `heal_any` effect in `game_engine.py`**

In `_apply_effect`, add case for `heal_any` (heals active hero for now; full UI targeting is Sprint B):

```python
    elif etype == "heal_any":
        # For now, heals the hero playing the card; full targeting in Sprint B
        hero["health"] = min(hero["health"] + val, hero["health_max"])
```

- [ ] **Step 5: Run all tests**

```
cd backend && python -m pytest tests/ -v
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/engine/adventure_config.py backend/app/engine/game_engine.py
git commit -m "feat: complete adventure 1-2 data, stub adventures 3-7"
```

---

## Sprint B — Full Content (Adventures 2–7, Unlock Tracking, i18n)

### Task B1: `user_adventures` migration

**Files:**
- Create: `supabase/migrations/003_user_adventures.sql`

- [ ] **Step 1: Write migration file**

```sql
create table public.user_adventures (
  user_id      uuid not null references public.users(id) on delete cascade,
  adventure    int  not null check (adventure between 1 and 7),
  completed_at timestamptz default now(),
  primary key (user_id, adventure)
);

alter table public.user_adventures enable row level security;

create policy "user_adventures_own" on public.user_adventures
  for all using (auth.uid() = user_id);

-- Adventure 1 is always unlocked — insert for every existing user
insert into public.user_adventures (user_id, adventure)
select id, 1 from public.users
on conflict do nothing;

-- Trigger: auto-unlock adventure 1 for new users
create or replace function unlock_adventure_1()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_adventures (user_id, adventure) values (new.id, 1)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_user_created_unlock_a1
  after insert on public.users
  for each row execute function unlock_adventure_1();
```

- [ ] **Step 2: Apply migration via MCP**

Run in Claude Code session:
```
mcp supabase apply_migration project_id=pbuqrdammoawbzjmtbyb name=user_adventures [content above]
```

- [ ] **Step 3: Commit migration file**

```bash
git add supabase/migrations/003_user_adventures.sql
git commit -m "feat: user_adventures table for adventure unlock tracking"
```

---

### Task B2: Adventure unlock API

**Files:**
- Create: `backend/app/routes/adventures.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `adventures.py`**

```python
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
```

- [ ] **Step 2: Register in `main.py`**

Add import and include_router:

```python
from .routes import rooms, game, chat, adventures

# after existing routers:
app.include_router(adventures.router, prefix="/adventures", tags=["adventures"])
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routes/adventures.py backend/app/main.py
git commit -m "feat: adventure unlock/complete endpoints"
```

---

### Task B3: Call complete-adventure on game win

**Files:**
- Modify: `backend/app/routes/game.py`

- [ ] **Step 1: In `game_action`, detect win and record completion**

In the `game_action` route, after `sb.table("rooms").update(updates)...`, add:

```python
    if new_state.get("winner") == "heroes":
        try:
            adventure = new_state.get("adventure", 1)
            if 1 <= adventure <= 6:
                sb.table("user_adventures").upsert(
                    {"user_id": user["id"], "adventure": adventure + 1},
                    on_conflict="user_id,adventure"
                ).execute()
        except Exception:
            pass  # non-fatal
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/routes/game.py
git commit -m "feat: auto-unlock next adventure on heroes win"
```

---

### Task B4: Lobby shows locked adventures

**Files:**
- Modify: `frontend/src/pages/Lobby.jsx`
- Modify: `frontend/src/lib/api.js`

- [ ] **Step 1: Add `getUnlockedAdventures` to api.js**

```javascript
  getUnlockedAdventures: () => request('GET', '/adventures/unlocked'),
```

- [ ] **Step 2: Update Lobby.jsx to fetch and enforce unlocks**

In `frontend/src/pages/Lobby.jsx`, add state and fetch:

```javascript
const [unlockedAdventures, setUnlockedAdventures] = useState([1])

useEffect(() => {
  api.getUnlockedAdventures().then(setUnlockedAdventures).catch(() => {})
}, [])
```

Update adventure `<select>` to disable locked options:

```javascript
<select
  value={adventure}
  onChange={(e) => setAdventure(Number(e.target.value))}
  className="w-full mt-1 bg-hogwarts-dark/50 border border-hogwarts-gold/30 rounded-lg p-2 text-hogwarts-parchment"
>
  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
    <option key={n} value={n} disabled={!unlockedAdventures.includes(n)}>
      Adventure {n} {!unlockedAdventures.includes(n) ? '🔒' : ''}
    </option>
  ))}
</select>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Lobby.jsx frontend/src/lib/api.js
git commit -m "feat: lobby shows locked adventures based on user progress"
```

---

### Task B5: i18n event log entries

**Files:**
- Modify: `backend/app/routes/game.py`
- Modify: `frontend/src/i18n/it.json`
- Modify: `frontend/src/i18n/en.json`

- [ ] **Step 1: Add event text generation to `_log_event` in `game.py`**

Replace `_log_event`:

```python
def _log_event(sb, room_id: str, turn: int, event_type: str, payload: dict):
    text_map = {
        "play_card": {"it": "ha giocato {card_id}", "en": "played {card_id}"},
        "buy_card": {"it": "ha comprato {card_id}", "en": "bought {card_id}"},
        "assign_attack": {"it": "attacca {villain_id}", "en": "attacks {villain_id}"},
        "end_turn": {"it": "fine turno", "en": "end turn"},
        "dark_arts": {"it": "fase Arti Oscure risolta", "en": "Dark Arts phase resolved"},
        "villain": {"it": "fase Attacco Malvagi risolta", "en": "Villain Attack phase resolved"},
        "game_start": {"it": "partita iniziata - Avventura {adventure}", "en": "game started - Adventure {adventure}"},
        "end_phase": {"it": "fine fase", "en": "end phase"},
    }
    entry = text_map.get(event_type, {"it": event_type, "en": event_type})
    text_it = entry["it"].format(**payload)
    text_en = entry["en"].format(**payload)
    try:
        sb.table("event_log").insert({
            "room_id": room_id,
            "turn": turn,
            "event_type": event_type,
            "payload": {**payload, "text_it": text_it, "text_en": text_en},
        }).execute()
    except Exception:
        pass
```

- [ ] **Step 2: Update EventLog.jsx to use language-aware text**

In `frontend/src/components/ui/EventLog.jsx`, use `i18n.language`:

```javascript
import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'

const EVENT_ICONS = {
  play_card: '🃏', buy_card: '🔮', assign_attack: '⚔️',
  end_turn: '🔄', villain: '💀', dark_arts: '🌑',
  hero_stunned: '⚡', villain_defeated: '✨', game_start: '🏰', default: '•',
}

export default function EventLog() {
  const { eventLog } = useGameStore()
  const { i18n } = useTranslation()
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [eventLog])

  return (
    <div className="flex flex-col bg-hogwarts-dark/50 border border-hogwarts-gold/20 rounded-lg overflow-hidden flex-1">
      <div className="text-xs font-semibold text-hogwarts-gold/60 px-2 py-1 border-b border-hogwarts-gold/10">
        📜 Log
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
        {eventLog.map((e) => {
          const text = i18n.language === 'en'
            ? e.payload?.text_en
            : e.payload?.text_it
          return (
            <div key={e.id} className="text-hogwarts-parchment/70 leading-relaxed">
              <span className="mr-1">{EVENT_ICONS[e.event_type] || EVENT_ICONS.default}</span>
              <span>{text || e.event_type}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routes/game.py frontend/src/components/ui/EventLog.jsx
git commit -m "feat: bilingual event log text (it/en)"
```

---

## Sprint C — Polish

### Task C1: Card image upload (Supabase Storage)

**Files:**
- Create: `frontend/src/components/ui/CardImageUpload.jsx`
- Modify: `frontend/src/pages/Game.jsx`

- [ ] **Step 1: Create Supabase Storage bucket via MCP**

Run: apply SQL migration:
```sql
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict do nothing;

create policy "card_images_public_read" on storage.objects
  for select using (bucket_id = 'card-images');

create policy "card_images_host_upload" on storage.objects
  for insert with check (bucket_id = 'card-images' and auth.role() = 'authenticated');
```

- [ ] **Step 2: Create `CardImageUpload.jsx`**

```javascript
import { useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useCardStore } from '../../store/cardStore'
import { toast } from '../../hooks/useToast'

export default function CardImageUpload({ cardId, onUploaded }) {
  const inputRef = useRef()
  const { cards } = useCardStore()
  const card = cards[cardId]

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `${cardId}.${ext}`
    const { error } = await supabase.storage
      .from('card-images')
      .upload(path, file, { upsert: true })
    if (error) { toast.error(error.message); return }
    const { data: { publicUrl } } = supabase.storage.from('card-images').getPublicUrl(path)
    // Update card in DB
    await supabase.from('cards').update({ image_url: publicUrl }).eq('id', cardId)
    onUploaded?.(publicUrl)
    toast.success(`Immagine caricata per ${card?.name_it || cardId}`)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={upload} />
      <button
        onClick={() => inputRef.current.click()}
        className="text-xs px-2 py-1 border border-hogwarts-gold/30 rounded hover:bg-hogwarts-gold/10"
      >
        📷 Carica immagine
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Add upload button in CardDetail.jsx (host only)**

In `CardDetail.jsx`, add after effects section:

```javascript
import CardImageUpload from '../ui/CardImageUpload'

// Inside modal, after effects block:
{isHost && (
  <CardImageUpload
    cardId={cardId}
    onUploaded={(url) => {
      // Reload card store
      useCardStore.getState().cards[cardId].image_url = url
    }}
  />
)}
```

Pass `isHost` as prop from `HogwartsMarket` / `HandCards` down through `Card` → `CardDetail`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/CardImageUpload.jsx frontend/src/components/cards/CardDetail.jsx
git commit -m "feat: card image upload to Supabase Storage"
```

---

### Task C2: Disconnection soft-pause (Supabase Presence)

**Files:**
- Create: `frontend/src/hooks/usePresence.js`
- Create: `frontend/src/components/ui/PauseOverlay.jsx`
- Modify: `frontend/src/pages/Game.jsx`
- Modify: `frontend/src/store/gameStore.js`
- Modify: `backend/app/routes/rooms.py`
- Modify: `backend/app/models/schemas.py`

- [ ] **Step 1: Add `paused` to gameStore**

In `gameStore.js`, add `setPaused`:

```javascript
  paused: false,
  pausedPlayer: null,
  setPaused: (paused, pausedPlayer = null) => set({ paused, pausedPlayer }),
```

- [ ] **Step 2: Create `usePresence.js`**

```javascript
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'

export function usePresence(roomId) {
  const { gameState, setPaused } = useGameStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!roomId || !user) return

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const presentIds = Object.keys(state)
        if (!gameState) return
        const activeId = gameState.active_player_id
        const activePresent = presentIds.includes(activeId)
        if (!activePresent && gameState.phase !== 'lobby') {
          setPaused(true, activeId)
        } else {
          setPaused(false, null)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })

    return () => supabase.removeChannel(channel)
  }, [roomId, user, gameState?.active_player_id])
}
```

- [ ] **Step 3: Create `PauseOverlay.jsx`**

```javascript
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'

export default function PauseOverlay({ roomCode }) {
  const { t } = useTranslation()
  const { paused, pausedPlayer, room } = useGameStore()
  const { user } = useAuthStore()
  if (!paused) return null
  const isHost = room?.host_id === user?.id

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
      <div className="bg-hogwarts-dark border border-hogwarts-gold/40 rounded-xl p-8 text-center space-y-4 max-w-sm mx-4">
        <div className="text-4xl animate-pulse">⏸️</div>
        <h3 className="text-xl font-magic text-hogwarts-gold">Partita in pausa</h3>
        <p className="text-hogwarts-parchment/70 text-sm">
          Un giocatore si è disconnesso. In attesa di riconnessione... (3 min)
        </p>
        {isHost && (
          <button
            onClick={async () => {
              try {
                await api.transferHero(roomCode, { from_player_id: pausedPlayer, to_player_id: user.id })
              } catch {}
            }}
            className="px-4 py-2 bg-hogwarts-gold text-hogwarts-dark font-bold rounded-lg text-sm"
          >
            Prendi controllo eroe
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add `transferHero` to api.js**

```javascript
  transferHero: (code, body) =>
    request('POST', `/rooms/${code}/transfer-hero`, body),
```

- [ ] **Step 5: Add transfer-hero endpoint to `rooms.py`**

```python
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
```

- [ ] **Step 6: Wire into Game.jsx**

```javascript
import { usePresence } from '../hooks/usePresence'
import PauseOverlay from '../components/ui/PauseOverlay'

// Inside component:
usePresence(roomId)

// In JSX before closing tag:
<PauseOverlay roomCode={roomCode} />
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/hooks/usePresence.js frontend/src/components/ui/PauseOverlay.jsx frontend/src/pages/Game.jsx frontend/src/lib/api.js backend/app/routes/rooms.py
git commit -m "feat: disconnection soft-pause with Supabase Presence + host hero transfer"
```

---

### Task C3: Mobile responsive layout

**Files:**
- Modify: `frontend/src/pages/Game.jsx`

- [ ] **Step 1: Update Game.jsx board grid for mobile**

The current `grid-cols-12` breaks on small screens. Replace the main board div:

```javascript
{/* Main board — desktop: 3 columns; mobile: stacked */}
<div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 p-3 overflow-auto">
  {/* Left: Location + Villains */}
  <div className="md:col-span-3 space-y-2 flex flex-row md:flex-col gap-2 overflow-x-auto">
    <div className="min-w-[160px] md:min-w-0 flex-shrink-0 md:flex-shrink">
      <LocationCard locations={gameState.locations} />
    </div>
    <div className="min-w-[200px] md:min-w-0 flex-shrink-0 md:flex-shrink">
      <VillainZone villains={gameState.villains} onAttack={(id) => sendAction('ASSIGN_ATTACK', { villain_id: id })} />
    </div>
  </div>

  {/* Center: Market + Phase + Heroes */}
  <div className="md:col-span-6 flex flex-col gap-2">
    <PhaseIndicator phase={gameState.phase} activePlayer={gameState.active_player_id} heroes={gameState.heroes} />
    <HogwartsMarket
      market={gameState.hogwarts_market}
      onBuy={(cardId) => sendAction('BUY_CARD', { card_id: cardId })}
      disabled={!isMyTurn || gameState.phase !== 'actions'}
    />
    <DarkArtsDeck darkArts={gameState.dark_arts_deck} />
    <div className="space-y-1">
      {Object.entries(gameState.heroes).map(([heroId, hero]) => (
        <HeroPanel
          key={heroId}
          heroId={heroId}
          hero={hero}
          isActive={gameState.active_player_id === hero.player_id}
          isMyHero={hero.player_id === user?.id}
          onPlayCard={(cardId) => sendAction('PLAY_CARD', { card_id: cardId, hero_id: heroId })}
        />
      ))}
    </div>
    {isMyTurn && gameState.phase === 'actions' && (
      <button
        onClick={() => sendAction('END_PHASE')}
        className="w-full py-2 bg-hogwarts-red text-white font-bold rounded-lg hover:bg-hogwarts-red/90"
      >
        {t('game.endTurn')}
      </button>
    )}
    {isMyTurn && (gameState.phase === 'dark_arts' || gameState.phase === 'villain') && (
      <button
        onClick={() => sendAction('END_PHASE')}
        className="w-full py-2 bg-purple-900 text-white font-bold rounded-lg hover:bg-purple-800"
      >
        Risolvi fase →
      </button>
    )}
  </div>

  {/* Right: Chat + Log — hidden on mobile, toggleable */}
  <div className="md:col-span-3 flex flex-col gap-2 hidden md:flex">
    <ChatPanel roomCode={roomCode} />
    <EventLog />
  </div>
</div>
```

- [ ] **Step 2: Add mobile chat toggle button**

Add below the board:

```javascript
{/* Mobile: show/hide chat */}
<div className="md:hidden border-t border-hogwarts-gold/20 p-2">
  <details>
    <summary className="text-sm text-hogwarts-gold cursor-pointer">💬 Chat & Log</summary>
    <div className="mt-2 space-y-2 max-h-60 overflow-auto">
      <ChatPanel roomCode={roomCode} />
      <EventLog />
    </div>
  </details>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Game.jsx
git commit -m "feat: mobile responsive game layout"
```

---

### Task C4: PWA manifest + service worker

**Files:**
- Create: `frontend/public/manifest.json`
- Modify: `frontend/vite.config.js`
- Modify: `frontend/package.json`
- Modify: `frontend/index.html`

- [ ] **Step 1: Install vite-plugin-pwa**

```
cd frontend && npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Create `frontend/public/manifest.json`**

```json
{
  "name": "Hogwarts Battle",
  "short_name": "HB",
  "description": "Harry Potter: Hogwarts Battle – Digital Edition",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1A0A00",
  "theme_color": "#C9A84C",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Update `vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Hogwarts Battle',
        short_name: 'HB',
        theme_color: '#C9A84C',
        background_color: '#1A0A00',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
```

- [ ] **Step 4: Add placeholder icons**

Create 192×192 and 512×512 PNG icons at `frontend/public/icon-192.png` and `frontend/public/icon-512.png`. For now, copy any PNG and rename — replace with real icons later.

- [ ] **Step 5: Commit**

```bash
git add frontend/vite.config.js frontend/public/manifest.json frontend/public/icon-192.png frontend/public/icon-512.png
git commit -m "feat: PWA manifest + service worker via vite-plugin-pwa"
```

---

## Self-Review Checklist

### Spec coverage

| Spec requirement | Task |
|---|---|
| Fix lev_wingardium | A2 |
| Fix useChat filter | A10 |
| Fix win condition | A3 |
| Cards API + seeding | A7 |
| Frontend card store | A8, A9 |
| Phase auto-execution | A5 |
| Stun recovery | A6 |
| Villain attack config | A4 |
| Adventures 3–7 | A12 |
| Adventure unlock table | B1 |
| Adventure unlock API | B2, B3 |
| Lobby locked adventures | B4 |
| i18n event log | B5 |
| Card image upload | C1 |
| Disconnection handling | C2 |
| Mobile responsive | C3 |
| PWA | C4 |
| Toast errors | A11 |

### Type consistency

- `useGameState(roomId)` — hook takes UUID string ✓
- `useChat(roomId)` — hook takes UUID string ✓
- `usePresence(roomId)` — hook takes UUID string ✓
- `cardStore.get(cardId)` returns card object with fallback ✓
- `ADVENTURE_CONFIG[n].dark_arts_count` used in `_resolve_dark_arts_phase` ✓
- `villain.attack_each_turn` array used in `_resolve_villain_phase` ✓
- `TransferHeroRequest` defined in `rooms.py` not `schemas.py` — acceptable (local use only) ✓

### Known gaps (post-MVP)

- `heal_any` effect targets active hero only; full targeting UI deferred
- Horcrux tracker for adventures 6–7 referenced in config but not implemented in engine
- Icons for PWA are placeholder — need real artwork
