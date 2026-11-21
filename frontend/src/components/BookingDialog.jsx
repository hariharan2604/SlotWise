import { useEffect, useState } from 'react'
import { addHours } from 'date-fns'
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { api, errorMessage } from '../api'
import { parseBookingWindow, parseLocalDateTime, toLocalDateTimeInput } from '../utils/dateTime'
import UiIcon from './UiIcon'

export default function BookingDialog({
  open,
  resources,
  initialResource,
  initialStart,
  initialEnd,
  onClose,
  onBooked
}) {
  const [selectedResource, setSelectedResource] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [purpose, setPurpose] = useState('')
  const [availability, setAvailability] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [savingBooking, setSavingBooking] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setSelectedResource(initialResource ?? '')
    setStart(initialStart)
    setEnd(initialEnd)
    setPurpose('')
    setAvailability(null)
    setError('')
    setFieldErrors({})
  }, [open, initialResource, initialStart, initialEnd])

  const checkAvailability = async () => {
    setError('')
    setFieldErrors({})
    setAvailability(null)
    const nextErrors = {}
    if (!selectedResource) nextErrors.resource = 'Choose a resource.'
    if (!start) nextErrors.start = 'Choose a start time.'
    if (!end) nextErrors.end = 'Choose an end time.'
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      setError('Complete the highlighted fields.')
      return
    }
    setCheckingAvailability(true)
    try {
      const { startUtc, endUtc } = parseBookingWindow(start, end)
      const { data } = await api.get('/bookings/availability', {
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
    setFieldErrors({})
    setSavingBooking(true)
    try {
      const nextErrors = {}
      if (!selectedResource) nextErrors.resource = 'Choose a resource.'
      if (!start) nextErrors.start = 'Choose a start time.'
      if (!end) nextErrors.end = 'Choose an end time.'
      if (!purpose.trim()) nextErrors.purpose = 'Enter a purpose.'
      if (Object.keys(nextErrors).length) {
        setFieldErrors(nextErrors)
        throw new Error('Complete the highlighted fields.')
      }
      if (purpose.trim().length > 300) throw new Error('Purpose must be 300 characters or fewer.')
      const { startUtc, endUtc } = parseBookingWindow(start, end)
      const { data } = await api.get('/bookings/availability', {
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

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 1.5, bgcolor: '#fffefa', m: { xs: 1.5, sm: 3 } } }}>
    <DialogTitle sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 3.25, pb: 2, color: '#f8f6ec', bgcolor: '#24543f' }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#d6f278', color: '#1e392c' }}><UiIcon name="calendar" size={21} /></Box>
        <Box>
          <Typography sx={{ fontSize: 21, fontWeight: 750, letterSpacing: '-.04em' }}>Make it yours</Typography>
          <Typography sx={{ mt: .25, fontSize: 12, color: 'rgba(248,246,236,.65)' }}>Reserve a space for your next good idea.</Typography>
        </Box>
      </Stack>
    </DialogTitle>
    <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: '22px!important' }}>
      <Stack spacing={2}>
        {error && <Alert severity="error" variant="outlined" sx={{ borderRadius: 1 }} onClose={() => setError('')}>{error}</Alert>}
        {availability !== null && <Alert severity={availability ? 'success' : 'warning'}>
          {availability ? 'This resource is available for that time.' : 'This resource is already booked for that time.'}
        </Alert>}
        <TextField select label="Resource" value={selectedResource} error={Boolean(fieldErrors.resource)} helperText={fieldErrors.resource} onChange={e => { setSelectedResource(Number(e.target.value)); setAvailability(null); setFieldErrors(previous => ({ ...previous, resource: '' })) }} required>
          {resources.map(resource => <MenuItem value={resource.id} key={resource.id}>{resource.name} · {resource.location || 'Location not specified'}</MenuItem>)}
        </TextField>
        <DateTimePicker label="Start time" value={parseLocalDateTime(start)}
          format="dd/MM/yyyy hh:mm a"
          onChange={value => { setStart(toLocalDateTimeInput(value)); setAvailability(null); setFieldErrors(previous => ({ ...previous, start: '' })) }}
          minDateTime={new Date(Math.ceil(Date.now() / 300000) * 300000)}
          minutesStep={5} disablePast
          slotProps={{ textField: { fullWidth: true, required: true, error: Boolean(fieldErrors.start), helperText: fieldErrors.start } }} />
        <DateTimePicker label="End time" value={parseLocalDateTime(end)}
          format="dd/MM/yyyy hh:mm a"
          onChange={value => { setEnd(toLocalDateTimeInput(value)); setAvailability(null); setFieldErrors(previous => ({ ...previous, end: '' })) }}
          minDateTime={startDate ?? new Date(Math.ceil(Date.now() / 300000) * 300000)}
          maxDateTime={startDate ? addHours(startDate, 12) : undefined}
          minutesStep={5} disablePast
          slotProps={{ textField: { fullWidth: true, required: true, error: Boolean(fieldErrors.end), helperText: fieldErrors.end } }} />
        <TextField label="Purpose" value={purpose} onChange={e => { setPurpose(e.target.value); setFieldErrors(previous => ({ ...previous, purpose: '' })) }} error={Boolean(fieldErrors.purpose)} inputProps={{ maxLength: 300 }} helperText={fieldErrors.purpose || `${purpose.length}/300 characters`} multiline minRows={2} required />
        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: '#f0f2e8', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Box sx={{ color: '#718a49', display: 'flex', mt: .15 }}><UiIcon name="sparkle" size={16} /></Box>
          <Typography sx={{ fontSize: 11, lineHeight: 1.6, color: '#697263' }}>Times are shown in your local timezone. Reservations must be in the future and can be up to 12 hours long.</Typography>
        </Box>
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 1.5, pb: 3, gap: 1, flexWrap: 'wrap' }}>
      <Button onClick={onClose} color="inherit" sx={{ mr: 'auto', color: '#77796f' }}>Not now</Button>
      <Button onClick={checkAvailability} disabled={checkingAvailability || !selectedResource || !start || !end} sx={{ color: '#24543f' }}>
        {checkingAvailability ? <CircularProgress size={20} /> : 'Check availability'}
      </Button>
      <Button variant="contained" onClick={createBooking} disabled={savingBooking || !resources.length} endIcon={!savingBooking && <UiIcon name="arrow" size={16} />} sx={{ bgcolor: '#24543f', '&:hover': { bgcolor: '#193d2d' } }}>
        {savingBooking ? <CircularProgress size={20} color="inherit" /> : 'Confirm booking'}
      </Button>
    </DialogActions>
  </Dialog>
}
