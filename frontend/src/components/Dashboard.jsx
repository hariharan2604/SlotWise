import { lazy, Suspense, useEffect, useState } from 'react'
import {
  Alert, Avatar, Box, Button, CircularProgress, Drawer, Grid, IconButton, Snackbar, Stack, Typography
} from '@mui/material'
import { api, errorMessage } from '../api'
import BookingList from './BookingList'
import BookingDialog from './BookingDialog'
import OverviewPanel from './OverviewPanel'
import ResourceAdminPanel from './ResourceAdminPanel'
import OfficeLocationForm from './OfficeLocationForm'
import UiIcon from './UiIcon'

const OfficeLocationsPage = lazy(() => import('./OfficeLocationsPage'))

export default function Dashboard({ auth, onLogout }) {
  const isAdmin = auth.role === 'Admin'
  const [view, setView] = useState('overview')
  const [resources, setResources] = useState([])
  const [offices, setOffices] = useState([])
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
    const [resourceResponse, myBookingResponse, allBookingResponse, officeResponse] = await Promise.all([
      api.get('/resources'),
      api.get('/bookings/mine'),
      isAdmin ? api.get('/bookings') : Promise.resolve(null),
      api.get('/office-locations')
    ])
    setResources(resourceResponse.data)
    setBookings(myBookingResponse.data)
    setAllBookings(allBookingResponse?.data ?? [])
    setOffices(officeResponse.data)
  }

  useEffect(() => {
    load().catch((e) => setError(errorMessage(e))).finally(() => setLoading(false))
  }, [])

  const refresh = async () => {
    setError('')
    setLoading(true)
    try {
      await load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const openBooking = (resourceId, start = '', end = '') => {
    setInitialResource(resourceId)
    setInitialStart(start)
    setInitialEnd(end)
    setError('')
    setBookingDialog(true)
  }

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking? This action cannot be undone.')) return
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
    try { await load() } catch (e) { setError(errorMessage(e)) }
  }

  const resourceAssignmentChanged = async () => {
    setError('')
    setMessage('Resource assignment updated.')
    try { await load() } catch (e) { setError(errorMessage(e)) }
  }

  const bookingCreated = async () => {
    setMessage('Your resource is booked.')
    try { await load() } catch (e) { setError(errorMessage(e)) }
  }

  const navItems = [
    { id: 'overview', label: 'Explore spaces', mobileLabel: 'Explore', icon: 'grid' },
    { id: 'offices', label: 'Office locations', mobileLabel: 'Offices', icon: 'pin' },
    { id: 'bookings', label: 'My bookings', mobileLabel: 'Bookings', icon: 'calendar' },
    ...(isAdmin ? [{ id: 'admin', label: 'Manage workspace', mobileLabel: 'Manage', icon: 'settings' }] : [])
  ]
  const viewData = {
    overview: { eyebrow: 'YOUR WORKSPACE', title: 'Find your next space.', note: 'Good spaces make room for good ideas.' },
    offices: { eyebrow: 'FIND A LOCATION', title: 'Find your people.', note: 'Explore offices and the resources available at each one.' },
    bookings: { eyebrow: 'YOUR SCHEDULE', title: 'Time well reserved.', note: 'All your upcoming plans, together in one place.' },
    admin: { eyebrow: 'WORKSPACE TOOLS', title: 'Make room for everyone.', note: 'Keep shared resources useful, clear, and ready to book.' }
  }[view]
  const initials = auth.displayName?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  const NavLinks = ({ compact = false }) => <Stack direction={compact ? 'row' : 'column'} spacing={compact ? .25 : .65} sx={compact ? { width: '100%' } : undefined}>
    {navItems.map((item) => {
      const active = view === item.id
      return <Button key={item.id} aria-current={active ? 'page' : undefined} onClick={() => setView(item.id)} startIcon={<UiIcon name={item.icon} size={19} />} sx={{
        flex: compact ? 1 : undefined,
        minWidth: 0, justifyContent: compact ? 'center' : 'flex-start', flexDirection: compact ? 'column' : 'row',
        gap: compact ? .35 : 0, px: compact ? .25 : 1.5, py: compact ? .65 : 1.25, minHeight: compact ? 60 : 48,
        borderRadius: compact ? 1.5 : 1,
        color: compact ? (active ? '#24543f' : '#85867d') : (active ? '#f5f4e9' : 'rgba(248,246,236,.58)'),
        bgcolor: compact ? 'transparent' : (active ? 'rgba(214,242,120,.12)' : 'transparent'),
        '& .MuiButton-startIcon': { mr: compact ? 0 : 1.5, ml: 0 },
        '&:hover': { bgcolor: compact ? 'rgba(36,84,63,.07)' : 'rgba(214,242,120,.1)', color: compact ? '#24543f' : '#fff' }
      }}>
        {compact
          ? <Typography sx={{ fontSize: { xs: 9, sm: 10 }, fontWeight: active ? 800 : 600, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{item.mobileLabel}</Typography>
          : item.label}
      </Button>
    })}
  </Stack>

  return <Box sx={{ minHeight: '100vh', bgcolor: '#f4f2eb', display: 'flex', color: '#232921' }}>
    <Drawer variant="permanent" sx={{
      display: { xs: 'none', md: 'block' }, width: 252, flexShrink: 0,
      '& .MuiDrawer-paper': { width: 252, border: 'none', bgcolor: '#193d2d', color: '#f8f6ec', px: 2.2, py: 2.5, display: 'flex', flexDirection: 'column', height: '100vh' }
    }}>
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: 1.2, mb: 6 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#d6f278', color: '#1e392c' }}><UiIcon name="room" size={18} /></Box>
        <Typography sx={{ fontWeight: 800, letterSpacing: '-.045em', fontSize: 22 }}>slotwise<span style={{ color: '#d6f278' }}>.</span></Typography>
      </Stack>
      <Typography sx={{ pl: 1.5, mb: 1.2, color: 'rgba(248,246,236,.38)', fontSize: 10, fontWeight: 800, letterSpacing: 1.8 }}>MENU</Typography>
      <Box component="nav" aria-label="Primary navigation">
        <NavLinks />
      </Box>
      <Box sx={{ mt: 'auto', p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.07)' }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar sx={{ width: 38, height: 38, bgcolor: '#d6f278', color: '#193d2d', fontSize: 12, fontWeight: 800 }}>{initials}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap fontWeight={700}>{auth.displayName}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(248,246,236,.43)' }}>{auth.role}</Typography>
          </Box>
        </Stack>
        <Button fullWidth onClick={onLogout} startIcon={<UiIcon name="logout" size={17} />} sx={{ mt: 1.5, justifyContent: 'flex-start', color: 'rgba(248,246,236,.62)', px: 1.1, '&:hover': { bgcolor: 'rgba(255,255,255,.07)' } }}>Sign out</Button>
      </Box>
    </Drawer>

    <Box component="main" sx={{ flex: 1, minWidth: 0, pb: { xs: 'calc(78px + env(safe-area-inset-bottom))', md: 0 } }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1100, height: { xs: 64, sm: 72 }, px: { xs: 2, sm: 3.5, lg: 5 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255,254,250,.92)', borderBottom: '1px solid #e9e7de', backdropFilter: 'blur(14px)' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ display: { xs: 'block', md: 'none' }, fontSize: 20, fontWeight: 800, letterSpacing: '-.04em' }}>slotwise<span style={{ color: '#718a49' }}>.</span></Typography>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography sx={{ color: '#77796f', fontSize: 12 }}>{today}</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{viewData.eyebrow}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 13, color: '#77796f' }}>Hello, <strong style={{ color: '#232921' }}>{auth.displayName?.split(' ')[0]}</strong></Typography>
          <Avatar sx={{ bgcolor: '#e5eadc', color: '#24543f', width: 38, height: 38, fontSize: 12, fontWeight: 800 }}>{initials}</Avatar>
          <IconButton onClick={onLogout} aria-label="Sign out" sx={{ display: { xs: 'flex', md: 'none' }, color: '#24543f' }}><UiIcon name="logout" size={18} /></IconButton>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 1340, mx: 'auto', px: { xs: 2, sm: 3.5, lg: 5 }, py: { xs: 3, md: 4.5 } }}>
        <Grid container spacing={2.5} alignItems="stretch" sx={{ mb: { xs: 2.5, md: 4 } }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ minHeight: { xs: 210, md: 246 }, height: '100%', p: { xs: 3, sm: 4.5 }, borderRadius: 1.25, overflow: 'hidden', position: 'relative', color: '#f8f6ec', bgcolor: '#24543f', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ position: 'absolute', right: { xs: -105, md: -40 }, top: { xs: 0, md: -55 }, width: 290, height: 290, borderRadius: '50%', bgcolor: 'rgba(214,242,120,.09)', border: '1px solid rgba(214,242,120,.18)', '&::before': { content: '""', position: 'absolute', inset: 30, borderRadius: '50%', border: '1px solid rgba(214,242,120,.25)' }, '&::after': { content: '""', position: 'absolute', inset: 67, borderRadius: '50%', border: '1px solid rgba(214,242,120,.2)' } }} />
              <Box sx={{ position: 'relative', maxWidth: 570 }}>
                <Typography sx={{ color: '#d6f278', fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>{viewData.eyebrow}</Typography>
                <Typography sx={{ mt: 1.2, fontSize: { xs: 32, sm: 42, lg: 48 }, lineHeight: 1.04, letterSpacing: '-.06em', fontWeight: 700 }}>{viewData.title}</Typography>
                <Typography sx={{ mt: 1.3, color: 'rgba(248,246,236,.66)', fontSize: 14 }}>{viewData.note}</Typography>
              </Box>
              <Box sx={{ position: 'relative', mt: 2.5 }}>
                {view === 'overview' && <Button onClick={() => openBooking()} variant="contained" endIcon={<UiIcon name="arrow" size={17} />} sx={{ bgcolor: '#d6f278', color: '#1e392c', '&:hover': { bgcolor: '#e3fa9a' } }}>Book a space</Button>}
                {view === 'bookings' && <Typography sx={{ fontSize: 12, color: 'rgba(248,246,236,.55)' }}>A clear plan is a good start.</Typography>}
                {view === 'admin' && <Typography sx={{ fontSize: 12, color: 'rgba(248,246,236,.55)' }}>Your spaces. Your schedule. Your call.</Typography>}
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ height: '100%', minHeight: 180, p: 3.5, borderRadius: 1.25, position: 'relative', overflow: 'hidden', bgcolor: '#e7edda', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ position: 'absolute', right: -24, bottom: -37, width: 180, height: 180, borderRadius: '50%', bgcolor: '#d6f278', opacity: .48 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ position: 'relative' }}>
                <Typography sx={{ color: '#66745d', fontSize: 11, fontWeight: 800, letterSpacing: 1.5 }}>TODAY</Typography>
                <Box sx={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'rgba(36,84,63,.08)', color: '#24543f' }}><UiIcon name="sparkle" size={19} /></Box>
              </Stack>
              <Box sx={{ position: 'relative' }}>
                <Typography sx={{ fontSize: 28, fontWeight: 750, letterSpacing: '-.05em', color: '#22372a' }}>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date())}</Typography>
                <Typography sx={{ mt: .5, fontSize: 13, color: '#66745d' }}>Make a little room for a new idea.</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Snackbar open={Boolean(message)} autoHideDuration={4000} onClose={() => setMessage('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ bottom: { xs: 'calc(86px + env(safe-area-inset-bottom))', md: 24 } }}>
          <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 1, bgcolor: '#24543f' }} onClose={() => setMessage('')}>{message}</Alert>
        </Snackbar>
        {error && <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 1, bgcolor: '#fffefa', alignItems: 'center' }} action={
          error.toLowerCase().includes('server') || error.toLowerCase().includes('reach')
            ? <Button color="inherit" size="small" onClick={refresh}>Try again</Button>
            : undefined
        } onClose={() => setError('')}>{error}</Alert>}

        {loading ? <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}><CircularProgress color="primary" /></Box> : <>
          {view === 'overview' && <OverviewPanel resources={resources} bookings={bookings} onBook={openBooking} onViewBookings={() => setView('bookings')} />}
          {view === 'offices' && <Suspense fallback={<Box sx={{ minHeight: 340, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
            <OfficeLocationsPage onBook={openBooking} />
          </Suspense>}
          {view === 'bookings' && <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'end' }} spacing={1.5} sx={{ mb: 2.5 }}>
              <Box><Typography variant="h5">Your bookings</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>The spaces you’ve made time for.</Typography></Box>
              <Button onClick={() => openBooking()} variant="outlined" startIcon={<UiIcon name="plus" size={17} />} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>New booking</Button>
            </Stack>
            <BookingList bookings={bookings} onCancel={cancelBooking} />
          </Box>}
          {view === 'admin' && isAdmin && <Grid container spacing={2.5} alignItems="start">
            <Grid size={{ xs: 12 }}><OfficeLocationForm onChanged={refresh} /></Grid>
            <Grid size={{ xs: 12, lg: 5 }}><ResourceAdminPanel offices={offices} resources={resources} bookings={allBookings} onCreated={resourceCreated} onAssignmentChanged={resourceAssignmentChanged} /></Grid>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Box sx={{ mb: 2 }}><Typography variant="h5">Workspace schedule</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Bookings across the team. Future reservations can be cancelled.</Typography></Box>
              <BookingList bookings={allBookings} onCancel={cancelBooking} />
            </Grid>
          </Grid>}
        </>}
      </Box>
    </Box>

    <Box component="nav" aria-label="Primary navigation" sx={{ position: 'fixed', display: { xs: 'block', md: 'none' }, zIndex: 1200, bottom: 0, left: 0, right: 0, px: 1, pb: 'max(8px, env(safe-area-inset-bottom))', pt: .5, bgcolor: 'rgba(255,254,250,.96)', borderTop: '1px solid #e9e7de', backdropFilter: 'blur(14px)' }}>
      <NavLinks compact />
    </Box>
    <BookingDialog open={bookingDialog} resources={resources} initialResource={initialResource} initialStart={initialStart} initialEnd={initialEnd} onClose={() => setBookingDialog(false)} onBooked={bookingCreated} />
  </Box>
}
