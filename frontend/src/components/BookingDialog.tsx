import { useEffect, useState } from 'react'
import { addHours } from 'date-fns'
import {
  Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { api, errorMessage } from '../api'
import type { Resource } from '../types'
import { parseBookingWindow, parseLocalDateTime, toLocalDateTimeInput } from '../utils/dateTime'

type AvailabilityResponse = { resourceId: number; startUtc: string; endUtc: string; available: boolean }

export default function BookingDialog({
  open,
  resources,
  initialResource,
  initialStart,
  initialEnd,
  onClose,
  onBooked
}: {
  open: boolean
  resources: Resource[]
  initialResource?: number
  initialStart: string
  initialEnd: string
  onClose: () => void
  onBooked: () => Promise<void>
}) {
  const [selectedResource, setSelectedResource] = useState<number | ''>('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [purpose, setPurpose] = useState('')
  const [availability, setAvailability] = useState<boolean | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [savingBooking, setSavingBooking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedResource(initialResource ?? '')
    setStart(initialStart)
    setEnd(initialEnd)
    setPurpose('')
    setAvailability(null)
    setError('')
  }, [open, initialResource, initialStart, initialEnd])

  const checkAvailability = async () => {
    setError('')
    setAvailability(null)
    if (!selectedResource) {
      setError('Choose a resource first.')
      return
    }
    setCheckingAvailability(true)
    try {
      const { startUtc, endUtc } = parseBookingWindow(start, end)
      const { data } = await api.get<AvailabilityResponse>('/bookings/availability', {
        params: { resourceId: selectedResource, start: startUtc, end: endUtc }
      })
      setAvailability(data.available)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setCheckingAvailability(false)
    }
  }

  const createBooking = async () => {
    setError('')
    setSavingBooking(true)
    try {
      if (!selectedResource || !purpose.trim()) throw new Error('Choose a resource and enter a purpose.')
      if (purpose.trim().length > 300) throw new Error('Purpose must be 300 characters or fewer.')
      const { startUtc, endUtc } = parseBookingWindow(start, end)
      const { data } = await api.get<AvailabilityResponse>('/bookings/availability', {
        params: { resourceId: selectedResource, start: startUtc, end: endUtc }
      })
      if (!data.available) throw new Error('This resource is already booked for the selected time.')
      await api.post('/bookings', { resourceId: selectedResource, start: startUtc, end: endUtc, purpose: purpose.trim() })
      onClose()
      await onBooked()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSavingBooking(false)
    }
  }

  const startDate = parseLocalDateTime(start)

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle sx={{ fontWeight: 750 }}>Reserve a resource</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">Pick a resource and time. We’ll check for conflicts before confirming the reservation.</Typography>
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {availability !== null && <Alert severity={availability ? 'success' : 'warning'}>
          {availability ? 'This resource is available for that time.' : 'This resource is already booked for that time.'}
        </Alert>}
        <TextField select label="Resource" value={selectedResource} onChange={e => { setSelectedResource(Number(e.target.value)); setAvailability(null) }} required>
          {resources.map(resource => <MenuItem value={resource.id} key={resource.id}>{resource.name} · {resource.location || 'Location not specified'}</MenuItem>)}
        </TextField>
        <DateTimePicker label="Start time" value={parseLocalDateTime(start)}
          format="dd/MM/yyyy hh:mm a"
          onChange={value => { setStart(toLocalDateTimeInput(value)); setAvailability(null) }}
          minDateTime={new Date(Math.ceil(Date.now() / 300000) * 300000)}
          minutesStep={5} disablePast
          slotProps={{ textField: { fullWidth: true, required: true } }} />
        <DateTimePicker label="End time" value={parseLocalDateTime(end)}
          format="dd/MM/yyyy hh:mm a"
          onChange={value => { setEnd(toLocalDateTimeInput(value)); setAvailability(null) }}
          minDateTime={startDate ?? new Date(Math.ceil(Date.now() / 300000) * 300000)}
          maxDateTime={startDate ? addHours(startDate, 12) : undefined}
          minutesStep={5} disablePast
          slotProps={{ textField: { fullWidth: true, required: true } }} />
        <TextField label="Purpose" value={purpose} onChange={e => setPurpose(e.target.value)} inputProps={{ maxLength: 300 }} helperText={`${purpose.length}/300 characters`} multiline minRows={2} required />
        <Typography variant="caption" color="text.secondary">Times use your local timezone and are converted to UTC. Bookings must be in the future and no longer than 12 hours.</Typography>
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button onClick={onClose} color="inherit">Close</Button>
      <Button onClick={checkAvailability} disabled={checkingAvailability || !selectedResource || !start || !end}>
        {checkingAvailability ? <CircularProgress size={20} /> : 'Check availability'}
      </Button>
      <Button variant="contained" onClick={createBooking} disabled={savingBooking || !resources.length}>
        {savingBooking ? <CircularProgress size={20} color="inherit" /> : 'Confirm booking'}
      </Button>
    </DialogActions>
  </Dialog>
}
