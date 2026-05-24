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

def test_play_wingardium_leviosa_grants_influence():
    state = build_initial_state(1, {"harry": "player-1"})
    hero = state["heroes"]["harry"]
    # Force wingardium_leviosa into hand
    hero["hand"] = ["wingardium_leviosa"] + hero["hand"][:4]
    initial_influence = hero["influence_tokens"]
    new_state = apply_action(state, "PLAY_CARD", {"card_id": "wingardium_leviosa", "hero_id": "harry"}, "player-1")
    assert new_state["heroes"]["harry"]["influence_tokens"] == initial_influence + 1

def test_play_dobby_heals_active_hero():
    from app.engine.game_engine import build_initial_state, apply_action
    state = build_initial_state(1, {"harry": "player-1"})
    hero = state["heroes"]["harry"]
    hero["health"] = 5
    hero["hand"] = ["dobby"] + hero["hand"][:4]
    new_state = apply_action(state, "PLAY_CARD", {"card_id": "dobby", "hero_id": "harry"}, "player-1")
    assert new_state["heroes"]["harry"]["health"] == 7  # healed 2
