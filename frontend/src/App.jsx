import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'

export default function App() {
  const { user, loading, initialize } = useAuthStore()
  const path = window.location.pathname

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hogwarts-dark">
        <div className="text-hogwarts-gold text-2xl font-magic animate-pulse">
          🏰 Hogwarts Battle...
        </div>
      </div>
    )
  }

  if (!user) return <Home />
  if (path.startsWith('/game/')) return <Game />
  return <Lobby />
}
