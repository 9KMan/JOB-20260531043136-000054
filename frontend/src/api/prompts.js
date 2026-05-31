import { api } from './client'

export async function getPrompts(params = {}) {
  return api.get('/prompts', params)
}

export async function getPromptById(id) {
  return api.get(`/prompts/${id}`)
}

export async function createPrompt(data) {
  return api.post('/prompts', data)
}

export async function updatePrompt(id, data) {
  return api.put(`/prompts/${id}`, data)
}

export async function deletePrompt(id) {
  return api.delete(`/prompts/${id}`)
}

export async function approvePrompt(id) {
  return api.post(`/prompts/${id}/approve`)
}

export async function rejectPrompt(id, reason) {
  return api.post(`/prompts/${id}/reject`, { reason })
}

export async function suggestPrompt(data) {
  return api.post('/prompts/suggest', data)
}

export async function searchPrompts(query) {
  return api.get('/prompts/search', { q: query })
}

export async function getPromptCategories() {
  return api.get('/prompts/categories')
}
