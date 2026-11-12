import { useEffect, useState } from 'react'
import {
  Alert, AppBar, Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, MenuItem,
  Stack, Tab, Tabs, TextField, Toolbar, Typography
} from '@mui/material'
import { addHours, isValid } from 'date-fns'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { api, errorMessage } from './api'
import type { AuthResponse, Booking, Resource } from './types'

type AvailabilityResponse = { resourceId: number; startUtc: string; endUtc: string; available: boolean }
type View = 'overview' | 'bookings' | 'admin'

const formatDateTime = (value: string) => new Date(value).toLocaleString([], {
  dateStyle: 'medium',
  timeStyle: 'short'
})

const parseLocalDateTime = (value: string) => {
  if (!value) return null
  const parsed = new Date(value)
  return isValid(parsed) ? parsed : null
}

const toLocalDateTimeInput = (value: Date | null) => {
  if (!value || !isValid(value)) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

function Login({ onLogin }: { onLogin: (auth: AuthResponse) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [register, setRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>(
        register ? '/auth/register' : '/auth/login',
        register ? { displayName: displayName.trim(), email: email.trim(), password } : { email: email.trim(), password }
      )
      onLogin(data)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: { md: '1fr 1fr' },
      bgcolor: '#f5f7fb'
    }}>
      <Box sx={{
        display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between',
        p: { md: 7, lg: 10 }, color: 'white',
        background: 'linear-gradient(145deg, #142945 0%, #235c73 58%, #3b8c83 100%)'
      }}>
        <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>slotwise<span style={{ color: '#91e0c3' }}>.</span></Typography>
        <Box sx={{ maxWidth: 520 }}>
          <Typography variant="overline" sx={{ color: '#a8e8d1', letterSpacing: 2 }}>A calmer way to share space</Typography>
          <Typography variant="h2" fontWeight={750} letterSpacing={-2} lineHeight={1.08} sx={{ my: 2 }}>
            Make room for great work.
          </Typography>
          <Typography variant="h6" fontWeight={400} sx={{ color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>
            Find a space, check the time, and book the resources your team needs.
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.55)' }}>Workspace resource booking</Typography>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: 3 }}>
        <Card elevation={0} sx={{ width: '100%', maxWidth: 440, border: '1px solid #e6eaf0', borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Stack component="form" onSubmit={event => { event.preventDefault(); void submit() }} spacing={2.5}>
              <Box>
                <Typography variant="h4" fontWeight={750} letterSpacing={-1}>{register ? 'Create your account' : 'Welcome back'}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {register ? 'Join your workspace to reserve shared resources.' : 'Sign in to find and book your workspace.'}
                </Typography>
              </Box>
              {error && <Alert severity="error">{error}</Alert>}
              {register && <TextField autoComplete="name" label="Full name" value={displayName} onChange={e => setDisplayName(e.target.value)} required />}
              <TextField autoComplete="email" label="Work email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <TextField autoComplete={register ? 'new-password' : 'current-password'} label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              {register && <Typography variant="caption" color="text.secondary">Use at least 8 characters and include a number.</Typography>}
              <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.3, borderRadius: 2 }}>
                {loading ? <CircularProgress size={23} color="inherit" /> : register ? 'Create account' : 'Sign in'}
              </Button>
              <Divider />
              <Button color="inherit" onClick={() => { setRegister(!register); setError('') }}>
                {register ? 'Already have an account? Sign in' : 'New to SlotWise? Create an account'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

function BookingList({ bookings, onCancel }: { bookings: Booking[]; onCancel?: (id: number) => void }) {
  if (!bookings.length) {
    return <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
      <CardContent sx={{ py: 5, textAlign: 'center' }}>
        <Typography fontWeight={650}>Nothing booked yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Your confirmed and cancelled reservations will appear here.</Typography>
      </CardContent>
    </Card>
  }

  return <Stack spacing={1.5}>
    {bookings.map(booking => {
      const canCancel = booking.status === 'Confirmed' && new Date(booking.startUtc).getTime() > Date.now()
      return <Card variant="outlined" key={booking.id} sx={{ borderRadius: 2.5 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography fontWeight={700}>{booking.resourceName}</Typography>
                <Chip size="small" label={booking.status} color={booking.status === 'Confirmed' ? 'success' : 'default'} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{booking.purpose}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>{formatDateTime(booking.startUtc)} – {formatDateTime(booking.endUtc)}</Typography>
              {booking.bookedBy && <Typography variant="caption" color="text.secondary">Booked by {booking.bookedBy}</Typography>}
            </Box>
            {canCancel && onCancel && <Button color="error" variant="text" onClick={() => onCancel(booking.id)}>Cancel booking</Button>}
          </Stack>
        </CardContent>
      </Card>
    })}
  </Stack>
}

function Dashboard({ auth, onLogout }: { auth: AuthResponse; onLogout: () => void }) {
  const isAdmin = auth.role === 'Admin'
  const [view, setView] = useState<View>('overview')
  const [resources, setResources] = useState<Resource[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [bookingDialog, setBookingDialog] = useState(false)
  const [selectedResource, setSelectedResource] = useState<number | ''>('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [purpose, setPurpose] = useState('')
  const [availability, setAvailability] = useState<boolean | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [savingBooking, setSavingBooking] = useState(false)
  const [savingResource, setSavingResource] = useState(false)
  const [resourceName, setResourceName] = useState('')
  const [resourceDescription, setResourceDescription] = useState('')
  const [resourceLocation, setResourceLocation] = useState('')
  const [resourceCapacity, setResourceCapacity] = useState('1')
  const [searchStart, setSearchStart] = useState('')
  const [searchEnd, setSearchEnd] = useState('')
  const [availableResourceIds, setAvailableResourceIds] = useState<number[] | null>(null)
  const [searchingAvailability, setSearchingAvailability] = useState(false)
  const [availabilitySearchError, setAvailabilitySearchError] = useState('')

  const load = async () => {
    const allBookingsRequest = isAdmin ? api.get<Booking[]>('/bookings') : Promise.resolve(null)
    const [resourceResponse, myBookingResponse, allBookingResponse] = await Promise.all([
      api.get<Resource[]>('/resources'),
      api.get<Booking[]>('/bookings/mine'),
      allBookingsRequest
    ])
    setResources(resourceResponse.data)
    setBookings(myBookingResponse.data)
    setAllBookings(allBookingResponse?.data ?? [])
  }

  useEffect(() => {
    load().catch(e => setError(errorMessage(e))).finally(() => setLoading(false))
  }, [])

  const openBooking = (resourceId?: number, startTime = '', endTime = '') => {
    setSelectedResource(resourceId ?? '')
    setStart(startTime)
    setEnd(endTime)
    setPurpose('')
    setAvailability(null)
    setError('')
    setBookingDialog(true)
  }

  const localTimeAsUtc = (value: string) => {
    const date = new Date(value)
    if (!value || Number.isNaN(date.getTime())) throw new Error('Enter a valid start and end time.')
    return date.toISOString()
  }

  const parseBookingWindow = (startInput: string, endInput: string) => {
    const startUtc = localTimeAsUtc(startInput)
    const endUtc = localTimeAsUtc(endInput)
    const startTime = new Date(startUtc).getTime()
    const endTime = new Date(endUtc).getTime()
    if (endTime <= startTime) throw new Error('End time must be after start time.')
    if (startTime <= Date.now()) throw new Error('Bookings must start in the future.')
    if (endTime - startTime > 12 * 60 * 60 * 1000) throw new Error('A booking cannot exceed 12 hours.')
    return { startUtc, endUtc }
  }

  const findAvailableResources = async () => {
    setAvailabilitySearchError('')
    setAvailableResourceIds(null)
    setSearchingAvailability(true)
    try {
      const { startUtc, endUtc } = parseBookingWindow(searchStart, searchEnd)
      const { data } = await api.get<{ resourceIds: number[] }>('/bookings/availability/resources', {
        params: { start: startUtc, end: endUtc }
      })
      setAvailableResourceIds(data.resourceIds)
    } catch (e) {
      setAvailabilitySearchError(errorMessage(e))
    } finally {
      setSearchingAvailability(false)
    }
  }

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
      setBookingDialog(false)
      setMessage('Your resource is booked.')
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSavingBooking(false)
    }
  }

  const cancelBooking = async (id: number) => {
    setError('')
    try {
      await api.delete(`/bookings/${id}`)
      setMessage('Booking cancelled.')
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const createResource = async () => {
    setError('')
    setSavingResource(true)
    try {
      const capacity = Number(resourceCapacity)
      if (!resourceName.trim() || resourceName.trim().length > 120) throw new Error('Enter a resource name (up to 120 characters).')
      if (resourceDescription.length > 500) throw new Error('Description must be 500 characters or fewer.')
      if (resourceLocation.length > 150) throw new Error('Location must be 150 characters or fewer.')
      if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Capacity must be a positive whole number.')
      await api.post('/resources', {
        name: resourceName.trim(),
        description: resourceDescription.trim(),
        location: resourceLocation.trim(),
        capacity
      })
      setResourceName('')
      setResourceDescription('')
      setResourceLocation('')
      setResourceCapacity('1')
      setMessage('Resource added to the workspace.')
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSavingResource(false)
    }
  }

  const activeBookings = bookings.filter(b => b.status === 'Confirmed' && new Date(b.endUtc).getTime() > Date.now())
  const availableResources = availableResourceIds === null
    ? []
    : resources.filter(resource => availableResourceIds.includes(resource.id))

  return <>
    <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: '1px solid #e8ecf1' }}>
      <Toolbar sx={{ maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" fontWeight={800} letterSpacing={-0.7} sx={{ flexGrow: 1, color: '#19354d' }}>
          slotwise<span style={{ color: '#398c78' }}>.</span>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
          {auth.displayName} · {auth.role}
        </Typography>
        <Button onClick={onLogout} color="inherit">Sign out</Button>
      </Toolbar>
    </AppBar>
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{
        p: { xs: 3, md: 4 }, mb: 3, borderRadius: 4, color: 'white',
        background: 'linear-gradient(115deg, #19354d 0%, #245f70 65%, #398c78 100%)'
      }}>
        <Typography variant="overline" sx={{ color: '#b7ead9', letterSpacing: 1.8 }}>YOUR WORKSPACE</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={750} letterSpacing={-1}>Make space for what matters.</Typography>
            <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.75)' }}>Discover a resource and reserve the time you need.</Typography>
          </Box>
          <Button variant="contained" onClick={() => openBooking()} sx={{
            bgcolor: '#a9e3ce', color: '#18364a', fontWeight: 700, px: 2.5, py: 1.2,
            '&:hover': { bgcolor: '#c4f0e0' }, whiteSpace: 'nowrap'
          }}>New booking</Button>
        </Stack>
      </Box>

      <Tabs value={view} onChange={(_, value: View) => setView(value)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="overview" label="Overview" />
        <Tab value="bookings" label="My bookings" />
        {isAdmin && <Tab value="admin" label="Workspace admin" />}
      </Tabs>
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
      {error && !bookingDialog && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box> : <>
        {view === 'overview' && <>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              { label: 'Bookable resources', value: resources.length, note: 'Ready to reserve' },
              { label: 'Upcoming bookings', value: activeBookings.length, note: 'Confirmed and ahead' },
              { label: 'Your reservations', value: bookings.length, note: 'All booking history' }
            ].map(item => <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="h3" fontWeight={750} letterSpacing={-1} sx={{ mt: 1, color: '#19354d' }}>{item.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.note}</Typography>
                </CardContent>
              </Card>
            </Grid>)}
          </Grid>
          <Card variant="outlined" sx={{ mb: 4, borderRadius: 3, bgcolor: '#fbfcfe' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={750}>Find what’s free</Typography>
                  <Typography variant="body2" color="text.secondary">Choose a time window to see every resource available for your booking.</Typography>
                </Box>
                <Stack component="form" onSubmit={event => { event.preventDefault(); void findAvailableResources() }}
                  direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                  <DateTimePicker label="Start time" value={parseLocalDateTime(searchStart)}
                    format="dd/MM/yyyy hh:mm a"
                    onChange={value => {
                      setSearchStart(toLocalDateTimeInput(value))
                      setAvailableResourceIds(null)
                      setAvailabilitySearchError('')
                    }}
                    minDateTime={new Date(Math.ceil(Date.now() / 300000) * 300000)}
                    minutesStep={5} disablePast
                    slotProps={{ textField: { fullWidth: true, required: true } }} />
                  <DateTimePicker label="End time" value={parseLocalDateTime(searchEnd)}
                    format="dd/MM/yyyy hh:mm a"
                    onChange={value => {
                      setSearchEnd(toLocalDateTimeInput(value))
                      setAvailableResourceIds(null)
                      setAvailabilitySearchError('')
                    }}
                    minDateTime={parseLocalDateTime(searchStart) ?? new Date(Math.ceil(Date.now() / 300000) * 300000)}
                    maxDateTime={parseLocalDateTime(searchStart) ? addHours(parseLocalDateTime(searchStart)!, 12) : undefined}
                    minutesStep={5} disablePast
                    slotProps={{ textField: { fullWidth: true, required: true } }} />
                  <Button type="submit" variant="contained" disabled={searchingAvailability || !resources.length}
                    sx={{ minWidth: 170, py: 1.8, whiteSpace: 'nowrap' }}>
                    {searchingAvailability ? <CircularProgress size={22} color="inherit" /> : 'Find resources'}
                  </Button>
                </Stack>
                {availabilitySearchError && <Alert severity="error">{availabilitySearchError}</Alert>}
                {availableResourceIds !== null && <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    {availableResources.length
                      ? `${availableResources.length} available resource${availableResources.length === 1 ? '' : 's'}`
                      : 'No resources are free for that time'}
                  </Typography>
                  {availableResources.length > 0 && <Grid container spacing={1.5}>
                    {availableResources.map(resource => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={resource.id}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography fontWeight={700} noWrap>{resource.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{resource.location || 'Location not specified'} · Up to {resource.capacity}</Typography>
                            </Box>
                            <Button size="small" onClick={() => openBooking(resource.id, searchStart, searchEnd)}>Book</Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>)}
                  </Grid>}
                </Box>}
              </Stack>
            </CardContent>
          </Card>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'end' }} spacing={1} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={750} letterSpacing={-0.5}>Find a resource</Typography>
              <Typography variant="body2" color="text.secondary">Choose a space that fits your team and your plans.</Typography>
            </Box>
            <Button onClick={() => setView('bookings')}>View my bookings</Button>
          </Stack>
          {resources.length === 0 ? <Card variant="outlined"><CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Typography fontWeight={650}>No resources are available yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Ask a workspace administrator to add the first resource.</Typography>
          </CardContent></Card> : <Grid container spacing={2}>
            {resources.map(resource => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={resource.id}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, transition: 'transform .18s, box-shadow .18s', '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 } }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1.5} sx={{ height: '100%' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1}>
                      <Typography variant="h6" fontWeight={700} lineHeight={1.25}>{resource.name}</Typography>
                      <Chip size="small" label={`Up to ${resource.capacity}`} variant="outlined" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>{resource.description || 'A shared workspace resource.'}</Typography>
                    <Typography variant="caption" color="text.secondary">{resource.location || 'Location not specified'}</Typography>
                    <Button variant="outlined" fullWidth sx={{ mt: 'auto' }} onClick={() => openBooking(resource.id)}>Check time & book</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>)}
          </Grid>}
        </>}

        {view === 'bookings' && <Box>
          <Typography variant="h5" fontWeight={750} letterSpacing={-0.5}>My bookings</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Manage your upcoming reservations and review past bookings.</Typography>
          <BookingList bookings={bookings} onCancel={cancelBooking} />
        </Box>}

        {view === 'admin' && isAdmin && <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={750}>Add a workspace resource</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Create a room, shared space, or piece of equipment for people to reserve.</Typography>
                <Stack spacing={2}>
                  <TextField label="Resource name" value={resourceName} onChange={e => setResourceName(e.target.value)} inputProps={{ maxLength: 120 }} required />
                  <TextField label="Description" value={resourceDescription} onChange={e => setResourceDescription(e.target.value)} inputProps={{ maxLength: 500 }} multiline minRows={2} />
                  <TextField label="Location" value={resourceLocation} onChange={e => setResourceLocation(e.target.value)} inputProps={{ maxLength: 150 }} />
                  <TextField label="Capacity" type="number" value={resourceCapacity} onChange={e => setResourceCapacity(e.target.value)} inputProps={{ min: 1, step: 1 }} required />
                  <Button variant="contained" onClick={createResource} disabled={savingResource}>
                    {savingResource ? <CircularProgress size={22} color="inherit" /> : 'Add resource'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h6" fontWeight={750} sx={{ mb: 1 }}>All workspace bookings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Review reservations across the workspace. Future bookings can be cancelled.</Typography>
            <BookingList bookings={allBookings} onCancel={cancelBooking} />
          </Grid>
        </Grid>}
      </>}
    </Container>

    <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} fullWidth maxWidth="sm">
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
            minDateTime={parseLocalDateTime(start) ?? new Date(Math.ceil(Date.now() / 300000) * 300000)}
            maxDateTime={parseLocalDateTime(start) ? addHours(parseLocalDateTime(start)!, 12) : undefined}
            minutesStep={5} disablePast
            slotProps={{ textField: { fullWidth: true, required: true } }} />
          <TextField label="Purpose" value={purpose} onChange={e => setPurpose(e.target.value)} inputProps={{ maxLength: 300 }} helperText={`${purpose.length}/300 characters`} multiline minRows={2} required />
          <Typography variant="caption" color="text.secondary">Times use your local timezone and are converted to UTC. Bookings must be in the future and no longer than 12 hours.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={() => setBookingDialog(false)} color="inherit">Close</Button>
        <Button onClick={checkAvailability} disabled={checkingAvailability || !selectedResource || !start || !end}>
          {checkingAvailability ? <CircularProgress size={20} /> : 'Check availability'}
        </Button>
        <Button variant="contained" onClick={createBooking} disabled={savingBooking || !resources.length}>
          {savingBooking ? <CircularProgress size={20} color="inherit" /> : 'Confirm booking'}
        </Button>
      </DialogActions>
    </Dialog>
  </>
}

export default function App() {
  const [auth, setAuth] = useState<AuthResponse | null>(() => {
    const token = localStorage.getItem('slotwise_token')
    const email = localStorage.getItem('slotwise_email')
    const displayName = localStorage.getItem('slotwise_name')
    const role = localStorage.getItem('slotwise_role')
    return token && email && displayName && role ? { token, email, displayName, role } : null
  })
  const navigate = useNavigate()

  const login = (value: AuthResponse) => {
    localStorage.setItem('slotwise_token', value.token)
    localStorage.setItem('slotwise_email', value.email)
    localStorage.setItem('slotwise_name', value.displayName)
    localStorage.setItem('slotwise_role', value.role)
    setAuth(value)
    navigate('/')
  }

  const logout = () => {
    for (const key of ['slotwise_token', 'slotwise_email', 'slotwise_name', 'slotwise_role']) localStorage.removeItem(key)
    setAuth(null)
    navigate('/login')
  }

  return <Routes>
    <Route path="/login" element={auth ? <Navigate to="/" replace /> : <Login onLogin={login} />} />
    <Route path="/" element={auth ? <Dashboard auth={auth} onLogout={logout} /> : <Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
