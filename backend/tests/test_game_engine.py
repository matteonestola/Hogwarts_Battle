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
