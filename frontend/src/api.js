import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5080/api',
  withCredentials: true
})

api.interceptors.response.use((response) => {
  const body = response.data
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return { ...response, data: body.data }
  }
  return response
})

export function errorMessage(error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to reach the server. Check your connection and try again.'
    }
    const status = error.response?.status
    const body = error.response?.data
    const validationErrors = body?.errors
      ? Object.values(body.errors).flat().filter(Boolean).join(' ')
      : ''
    if (status === 401) return body?.detail || 'Your session has expired. Please sign in again.'
    if (status === 403) return body?.detail || 'You do not have permission to perform this action.'
    if (status === 404) return body?.detail || 'The requested item could not be found.'
    if (status === 409) return body?.detail || 'That action conflicts with the current reservation.'
    if (status >= 500) return 'The server could not complete the request. Please try again.'
    return body?.detail || body?.message || validationErrors || body?.title || 'The request could not be completed.'
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
