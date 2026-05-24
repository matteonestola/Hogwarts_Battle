from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import rooms, game, chat, adventures
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
app.include_router(adventures.router, prefix="/adventures", tags=["adventures"])


@app.get("/health")
def health():
    return {"status": "ok"}
