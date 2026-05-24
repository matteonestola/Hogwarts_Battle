from app.engine.game_engine import build_initial_state, apply_action, _check_win_lose

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

def test_play_wingardium_leviosa_grants_influence():
    state = build_initial_state(1, {"harry": "player-1"})
    hero = state["heroes"]["harry"]
    # Force wingardium_leviosa into hand
    hero["hand"] = ["wingardium_leviosa"] + hero["hand"][:4]
    initial_influence = hero["influence_tokens"]
    new_state = apply_action(state, "PLAY_CARD", {"card_id": "wingardium_leviosa", "hero_id": "harry"}, "player-1")
    assert new_state["heroes"]["harry"]["influence_tokens"] == initial_influence + 1

def test_play_dobby_heals_active_hero():
    state = build_initial_state(1, {"harry": "player-1"})
    hero = state["heroes"]["harry"]
    hero["health"] = 5
    hero["hand"] = ["dobby"] + hero["hand"][:4]
    new_state = apply_action(state, "PLAY_CARD", {"card_id": "dobby", "hero_id": "harry"}, "player-1")
    assert new_state["heroes"]["harry"]["health"] == 7  # healed 2

def test_win_when_all_villains_defeated():
    state = build_initial_state(1, {"harry": "player-1", "ron": "player-2"})
    # Defeat all villains manually
    defeated = state["villains"]["active"].copy()
    state["villains"]["defeated"] = defeated
    state["villains"]["active"] = []
    result = _check_win_lose(state)
    assert result["winner"] == "heroes"

def test_no_win_at_game_start():
    state = build_initial_state(1, {"harry": "player-1", "ron": "player-2"})
    result = _check_win_lose(state)
    assert result["winner"] is None

def test_no_win_when_only_some_villains_defeated():
    state = build_initial_state(1, {"harry": "player-1", "ron": "player-2"})
    # Adventure 1 has 2 villains (draco, quirrell) — defeat only 1
    one_villain = state["villains"]["active"].pop(0)
    state["villains"]["defeated"] = [one_villain]
    result = _check_win_lose(state)
    assert result["winner"] is None

def test_end_phase_dark_arts_advances_to_villain():
    state = build_initial_state(1, {"harry": "player-1", "ron": "player-2"})
    assert state["phase"] == "dark_arts"
    initial_deck_count = len(state["dark_arts_deck"]["deck"])
    new_state = apply_action(state, "END_PHASE", {}, "player-1")
    assert new_state["phase"] == "villain"
    # Adventure 1 dark_arts_count=1, so 1 card drawn
    assert len(new_state["dark_arts_deck"]["deck"]) == initial_deck_count - 1
    assert len(new_state["dark_arts_deck"]["discard"]) == 1

def test_end_phase_villain_advances_to_actions():
    state = build_initial_state(1, {"harry": "player-1", "ron": "player-2"})
    state["phase"] = "villain"
    new_state = apply_action(state, "END_PHASE", {}, "player-1")
    assert new_state["phase"] == "actions"

def test_end_phase_villain_applies_draco_control_token():
    state = build_initial_state(1, {"harry": "player-1"})
    state["phase"] = "villain"
    active_loc_id = state["locations"]["stack"][state["locations"]["active_index"]]["id"]
    initial_tokens = state["locations"]["control_tokens"][active_loc_id]
    new_state = apply_action(state, "END_PHASE", {}, "player-1")
    # Draco adds 1 control token per turn
    assert new_state["locations"]["control_tokens"][active_loc_id] >= initial_tokens + 1
