# Hogwarts Battle – Complete Implementation Design

## Context

Digital implementation of Harry Potter: Hogwarts Battle board game. Monorepo with React+Vite frontend (Vercel), FastAPI backend (Railway), Supabase (PostgreSQL + Realtime + Auth). Scaffold exists; core game logic, content, and polish are missing.

---

## Sprint A — Core Playable Game (Phases 1–4)

### A1: Bug Fixes

| Bug | File | Fix |
|-----|------|-----|
| `lev_wingardium` undefined | `backend/app/engine/game_engine.py` | Replace with `wingardium_leviosa` card; add to CARD_DATA |
| `useChat.js` filter `room_code` wrong column | `frontend/src/hooks/useChat.js` | Filter by `room_id` — requires loading room_id from store |
| Realtime event_log filter same issue | same file | same fix |
| Win condition logic inverted | `backend/app/engine/game_engine.py` L304 | Fix: check `not active AND defeated >= total` |

### A2: Cards Catalog API

New endpoint: `GET /cards?adventure=1` returns array of card objects.

Backend seeds `public.cards` table from `CARD_DATA` dict on startup (INSERT ... ON CONFLICT DO NOTHING).

Frontend fetches cards on game init → stores in `useCardStore` (Zustand). Components access via `cardStore.get(cardId)`.

### A3: Phase Auto-Execution

**Dark Arts phase** (`END_PHASE` when phase=`dark_arts`):
1. Draw N cards from dark_arts_deck (N = `adventure_config.dark_arts_count`)
2. Apply each card's effects to game state automatically
3. Record each card drawn in `event_log`
4. Advance phase to `villain`

**Villain phase** (`END_PHASE` when phase=`villain`):
1. Each active villain applies their passive attack (adds control tokens or deals damage per villain config's `attack_each_turn`)
2. Check location control limits → advance location index if exceeded
3. Record attacks in `event_log`
4. Advance phase to `actions`

Phase auto-execution happens entirely in backend `apply_action("END_PHASE", ...)`. Frontend just calls API and re-renders from new state.

### A4: Hero Starting Decks

Per spec, all heroes start with 7× Alohomora + 3× Wingardium Leviosa. Define `wingardium_leviosa` card:
- Cost: 0, effect: `{type: "influence", value: 1}` (same as Alohomora for Adventure 1; heroes get unique cards in later adventures)

### A5: Stun Recovery

When a hero reaches 0 health:
1. Set `stunned: true`
2. Hero skips their next turn (backend skips stunned heroes in turn order advance)
3. On their next turn: discard hand, draw 5, set `stunned: false`, health restored to `stun_recovery_health` (default 1)
4. All heroes stunned simultaneously = villain win

### A6: Frontend Card Data Integration

`useCardStore.js` (Zustand):
- `cards: {}` — map of cardId → card object
- `loadCards(adventure)` — calls `GET /cards?adventure={n}`, populates map
- `get(cardId)` — returns card or stub `{id: cardId, name_it: cardId, name_en: cardId}`

Components `Card.jsx`, `HandCards.jsx`, `HogwartsMarket.jsx` receive card data from store instead of prop drilling.

`Game.jsx` calls `loadCards(gameState.adventure)` on mount.

### A7: Complete Adventure 1 Card Set

Add to `adventure_config.py / CARD_DATA`:
- `wingardium_leviosa` (influence 1)
- `hogwarts_founders` (influence 3)
- `polyjuice_potion` (draw 2)
- `dobby` (heal 2, any hero)
- `chaos` (dark arts: control token)
- `basilisk` (dark arts: damage 3 to chosen hero)

Villain attack config per villain (added to VILLAIN_DATA):
- `attack_each_turn: [{"type": "control_token"|"damage", "target": "active_location"|"all"|"active_hero", "value": N}]`

### A8: Testing

Manual test path:
1. Create room, set adventure 1, assign heroes, start game
2. Confirm dark arts phase auto-resolves on END_PHASE
3. Confirm villain phase adds control tokens
4. Play cards, buy card, end turn
5. Advance to stun → confirm recovery next turn
6. Defeat all villains → confirm victory modal

---

## Sprint B — Full Content (Phases 5–6)

### B1: Adventures 3–7

Add to `adventure_config.py`:
- Adventure 3: `bellatrix`, `fenrir`, `dolohov`; 2 dark arts; new locations `azkaban`, `ministry`
- Adventure 4: Death Eaters added
- Adventure 5: Umbridge, new card type `detention`
- Adventure 6: Horcrux tracker added to game_state
- Adventure 7: All villain slots, horcrux tracker, `avada_kedavra` dark arts

Each adventure adds new market cards unique to that box.

### B2: Adventure Unlock Tracking

New Supabase table:
```sql
create table user_adventures (
  user_id   uuid references public.users(id),
  adventure int,
  completed_at timestamptz default now(),
  primary key (user_id, adventure)
);
```

`GET /adventures/unlocked` returns list of unlocked adventures for current user. Lobby shows locked adventures as disabled. On game win, `POST /adventures/complete` records completion.

### B3: i18n Completion

Event log entries use i18n keys: `event.play_card`, `event.villain_attack`, etc. Keys interpolate hero/card/villain names from current language.

Add `it.json`/`en.json` keys for all event types, all adventure-specific card names.

---

## Sprint C — Polish (Phases 7–9)

### C1: Custom Card Images (Supabase Storage)

Bucket: `card-images` (public).

New admin UI component `CardImageUpload.jsx` (accessible only to `host_id`). Uploads file to `card-images/{cardId}.jpg`, sets `image_url` on `public.cards`.

`Card.jsx` already handles `image_url !== null` case with `<img>`.

### C2: Disconnection Handling

Use Supabase Presence on channel `room:{code}:presence`.

Backend logic:
- Each client sends heartbeat on connect
- If active player's presence drops, set `game_state.paused = true`, `game_state.pause_started_at = ISO timestamp`
- 3-minute timer (checked on next action): if exceeded, host can call `POST /rooms/{code}/transfer-hero` with `{from_player_id, to_player_id}`

Frontend:
- Subscribe to presence changes in `useGameState.js`
- Show `PauseOverlay` component when `gameState.paused === true`
- Host sees "Transfer hero" button

### C3: Mobile Responsive + PWA

- Tailwind responsive classes: stack board vertically on `sm:` breakpoint
- `public/manifest.json`: name, icons, `display: standalone`
- `public/sw.js`: cache shell assets for offline load
- `vite.config.js`: register service worker via `vite-plugin-pwa`

---

## Cross-Cutting Concerns

### Error Handling

- Backend: all game actions return 400 with `detail` message for invalid moves (not your turn, insufficient influence, etc.)
- Frontend: `api.js` throws on non-OK; components catch and show inline error toast (new `useToast` hook + `Toast.jsx` component)

### Event Log Text

Backend `_log_event` receives `text_it`/`text_en` human-readable strings alongside `event_type`. Frontend displays `payload.text_it` or `payload.text_en` based on room language setting.

### State Consistency

`game_state` JSONB is the single source of truth. Backend always returns full state on action. Frontend never mutates local state — always waits for Realtime or API response. Optimistic updates are explicitly NOT used to avoid divergence in multiplayer.

---

## Files Changed Per Sprint

### Sprint A
**Backend:**
- `app/engine/game_engine.py` — phase auto-execution, stun recovery, hero_id resolution for multi-hero
- `app/engine/adventure_config.py` — complete card/villain/location data
- `app/routes/game.py` — cards seeding on startup, new GET /cards endpoint
- `app/routes/rooms.py` — hero assignment defaults fixed
- `app/models/schemas.py` — no changes

**Frontend:**
- `src/store/cardStore.js` — NEW: card catalog store
- `src/hooks/useChat.js` — fix room_id filter
- `src/hooks/useGameState.js` — pass room_id for filter
- `src/lib/api.js` — add `getCards(adventure)` call
- `src/pages/Game.jsx` — call loadCards on mount
- `src/components/cards/Card.jsx` — read from cardStore
- `src/components/hero/HandCards.jsx` — read from cardStore
- `src/components/board/HogwartsMarket.jsx` — read from cardStore
- `src/components/ui/Toast.jsx` — NEW: error toasts

### Sprint B
**Backend:**
- `app/engine/adventure_config.py` — add adventures 3–7
- `app/routes/adventures.py` — NEW: unlock endpoints
- `app/main.py` — register adventures router

**Supabase:**
- Migration `003_user_adventures.sql`

**Frontend:**
- `src/pages/Lobby.jsx` — lock/unlock adventure selector
- `src/lib/api.js` — add adventures API calls

### Sprint C
**Frontend:**
- `src/components/ui/CardImageUpload.jsx` — NEW
- `src/hooks/usePresence.js` — NEW: Supabase Presence
- `src/components/ui/PauseOverlay.jsx` — NEW
- `src/pages/Game.jsx` — wire presence + pause
- `public/manifest.json` — NEW
- `public/sw.js` — NEW (via vite-plugin-pwa)
- `vite.config.js` — add PWA plugin

**Backend:**
- `app/routes/rooms.py` — add transfer-hero endpoint
