import { useEffect, useState } from 'react'
import {
  Alert, AppBar, Box, Button, CircularProgress, Container, Grid, Stack, Tab, Tabs, Toolbar, Typography
} from '@mui/material'
import { api, errorMessage } from '../api'
import BookingList from './BookingList'
import BookingDialog from './BookingDialog'
import OverviewPanel from './OverviewPanel'
import ResourceAdminPanel from './ResourceAdminPanel'

export default function Dashboard({ auth, onLogout }) {
  const isAdmin = auth.role === 'Admin'
  const [view, setView] = useState('overview')
  const [resources, setResources] = useState([])
  const [bookings, setBookings] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [bookingDialog, setBookingDialog] = useState(false)
  const [initialResource, setInitialResource] = useState()
  const [initialStart, setInitialStart] = useState('')
  const [initialEnd, setInitialEnd] = useState('')

  const load = async () => {
    const allBookingsRequest = isAdmin ? api.get('/bookings') : Promise.resolve(null)
    const [resourceResponse, myBookingResponse, allBookingResponse] = await Promise.all([
      api.get('/resources'),
      api.get('/bookings/mine'),
      allBookingsRequest
    ])
    setResources(resourceResponse.data)
    setBookings(myBookingResponse.data)
    setAllBookings(allBookingResponse?.data ?? [])
  }

  useEffect(() => {
    load().catch((e) => setError(errorMessage(e))).finally(() => setLoading(false))
  }, [])

  const openBooking = (resourceId, start = '', end = '') => {
    setInitialResource(resourceId)
    setInitialStart(start)
    setInitialEnd(end)
    setError('')
    setBookingDialog(true)
  }

  const cancelBooking = async (id) => {
    setError('')
    try {
      await api.delete(`/bookings/${id}`)
      setMessage('Booking cancelled.')
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const resourceCreated = async () => {
    setError('')
    setMessage('Resource added to the workspace.')
    try {
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const bookingCreated = async () => {
    setMessage('Your resource is booked.')
    try {
      await load()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

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

      <Tabs value={view} onChange={(_, value) => setView(value)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="overview" label="Overview" />
        <Tab value="bookings" label="My bookings" />
        {isAdmin && <Tab value="admin" label="Workspace admin" />}
      </Tabs>
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
      {error && !bookingDialog && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box> : <>
        {view === 'overview' && <OverviewPanel
          resources={resources}
          bookings={bookings}
          onBook={openBooking}
          onViewBookings={() => setView('bookings')}
        />}
        {view === 'bookings' && <Box>
          <Typography variant="h5" fontWeight={750} letterSpacing={-0.5}>My bookings</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Manage your upcoming reservations and review past bookings.</Typography>
          <BookingList bookings={bookings} onCancel={cancelBooking} />
        </Box>}
        {view === 'admin' && isAdmin && <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <ResourceAdminPanel onCreated={resourceCreated} onError={setError} />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h6" fontWeight={750} sx={{ mb: 1 }}>All workspace bookings</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Review reservations across the workspace. Future bookings can be cancelled.</Typography>
            <BookingList bookings={allBookings} onCancel={cancelBooking} />
          </Grid>
        </Grid>}
      </>}
    </Container>

    <BookingDialog
      open={bookingDialog}
      resources={resources}
      initialResource={initialResource}
      initialStart={initialStart}
      initialEnd={initialEnd}
      onClose={() => setBookingDialog(false)}
      onBooked={bookingCreated}
    />
  </>
}
