import { create } from 'zustand'

export const useGameStore = create((set) => ({
  room: null,
  gameState: null,
  chatMessages: [],
  eventLog: [],

  setRoom: (room) => set({ room }),
  setGameState: (gameState) => set({ gameState }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  addEventLog: (event) => set((s) => ({ eventLog: [...s.eventLog, event] })),
  setEventLog: (eventLog) => set({ eventLog }),
  reset: () => set({ room: null, gameState: null, chatMessages: [], eventLog: [] }),
}))
