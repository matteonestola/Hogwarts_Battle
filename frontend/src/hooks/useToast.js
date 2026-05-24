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
