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
