import axios from 'axios'

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5080/api' })

api.interceptors.response.use((response) => {
  const body = response.data
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return { ...response, data: body.data }
  }
  return response
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('slotwise_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function errorMessage(error) {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data
    const validationErrors = body?.errors && Object.values(body.errors).flat().join(' ')
    return body?.detail || body?.message || validationErrors || body?.title || error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
