import { isValid } from 'date-fns'

export const parseLocalDateTime = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  return isValid(parsed) ? parsed : null
}

export const toLocalDateTimeInput = (value) => {
  if (!value || !isValid(value)) return ''
  const pad = (part) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

export const parseBookingWindow = (startInput, endInput) => {
  const toUtc = (value) => {
    const date = new Date(value)
    if (!value || Number.isNaN(date.getTime())) throw new Error('Enter a valid start and end time.')
    return date.toISOString()
  }
  const startUtc = toUtc(startInput)
  const endUtc = toUtc(endInput)
  const startTime = new Date(startUtc).getTime()
  const endTime = new Date(endUtc).getTime()
  if (endTime <= startTime) throw new Error('End time must be after start time.')
  if (startTime <= Date.now()) throw new Error('Bookings must start in the future.')
  if (endTime - startTime > 12 * 60 * 60 * 1000) throw new Error('A booking cannot exceed 12 hours.')
  return { startUtc, endUtc }
}

export const formatDateTime = (value) => new Date(value).toLocaleString([], {
  dateStyle: 'medium',
  timeStyle: 'short'
})
