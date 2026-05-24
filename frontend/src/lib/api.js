import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL

async function request(method, path, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = { 'Content-Type': 'application/json' }
  if (session) headers['Authorization'] = `Bearer ${session.access_token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'API error')
  }

  return res.status === 204 ? null : res.json()
}

export const api = {
  createRoom: (adventure, language) =>
    request('POST', '/rooms', { adventure, language }),
  getRoom: (code) => request('GET', `/rooms/${code}`),
  joinRoom: (code) => request('POST', `/rooms/${code}/join`),
  startGame: (code) => request('POST', `/rooms/${code}/start`),
  leaveRoom: (code) => request('DELETE', `/rooms/${code}`),
  assignHeroes: (code, heroAssignments) =>
    request('POST', `/rooms/${code}/assign-heroes`, heroAssignments),
  sendAction: (code, type, payload = {}) =>
    request('POST', `/rooms/${code}/action`, { type, payload }),
  getChat: (code) => request('GET', `/rooms/${code}/chat`),
  sendChat: (code, content) =>
    request('POST', `/rooms/${code}/chat`, { content }),
  getCards: (adventure = 1) =>
    request('GET', `/cards?adventure=${adventure}`),
  getUnlockedAdventures: () => request('GET', '/adventures/unlocked'),
  transferHero: (code, body) =>
    request('POST', `/rooms/${code}/transfer-hero`, body),
}
