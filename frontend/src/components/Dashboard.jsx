import { lazy, Suspense, useEffect, useState } from 'react'
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Drawer, Grid, IconButton, Snackbar, Stack, Typography
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
  const upcomingBookings = allBookings.filter((booking) =>
    booking.status === 'Confirmed' && new Date(booking.startUtc).getTime() > Date.now()
  ).length
  const adminMetrics = [
    { label: 'Active offices', value: offices.filter((office) => office.isActive).length, note: `${offices.length} registered locations`, icon: 'pin', tint: '#edf1e4', ink: '#24543f' },
    { label: 'Shared spaces', value: resources.length, note: 'Ready for your team', icon: 'room', tint: '#f5ebe1', ink: '#9c6939' },
    { label: 'Upcoming bookings', value: upcomingBookings, note: 'Confirmed reservations', icon: 'calendar', tint: '#eff0e5', ink: '#69734a' }
  ]

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
        {view === 'overview' && <Grid container spacing={2.5} alignItems="stretch" sx={{ mb: { xs: 2.5, md: 4 } }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box className="dashboard-hero motion-enter" sx={{ minHeight: { xs: 210, md: 246 }, height: '100%', p: { xs: 3, sm: 4.5 }, borderRadius: 1.25, overflow: 'hidden', position: 'relative', color: '#f8f6ec', bgcolor: '#24543f', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box className="dashboard-hero-orbit" sx={{ position: 'absolute', right: { xs: -105, md: -40 }, top: { xs: 0, md: -55 }, width: 290, height: 290, borderRadius: '50%', bgcolor: 'rgba(214,242,120,.09)', border: '1px solid rgba(214,242,120,.18)', '&::before': { content: '""', position: 'absolute', inset: 30, borderRadius: '50%', border: '1px solid rgba(214,242,120,.25)' }, '&::after': { content: '""', position: 'absolute', inset: 67, borderRadius: '50%', border: '1px solid rgba(214,242,120,.2)' } }} />
              <Box sx={{ position: 'relative', maxWidth: 570 }}>
                <Typography sx={{ color: '#d6f278', fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>{viewData.eyebrow}</Typography>
                <Typography sx={{ mt: 1.2, fontSize: { xs: 32, sm: 42, lg: 48 }, lineHeight: 1.04, letterSpacing: '-.06em', fontWeight: 700 }}>{viewData.title}</Typography>
                <Typography sx={{ mt: 1.3, color: 'rgba(248,246,236,.66)', fontSize: 14 }}>{viewData.note}</Typography>
              </Box>
              <Box sx={{ position: 'relative', mt: 2.5 }}>
                <Button onClick={() => openBooking()} variant="contained" endIcon={<UiIcon name="arrow" size={17} />} sx={{ bgcolor: '#d6f278', color: '#1e392c', '&:hover': { bgcolor: '#e3fa9a' } }}>Book a space</Button>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box className="motion-enter motion-delay-1" sx={{ height: '100%', minHeight: 180, p: 3.5, borderRadius: 1.25, position: 'relative', overflow: 'hidden', bgcolor: '#e7edda', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box className="dashboard-day-orb" sx={{ position: 'absolute', right: -24, bottom: -37, width: 180, height: 180, borderRadius: '50%', bgcolor: '#d6f278', opacity: .48 }} />
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
        </Grid>}

        <Snackbar open={Boolean(message)} autoHideDuration={4000} onClose={() => setMessage('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ bottom: { xs: 'calc(86px + env(safe-area-inset-bottom))', md: 24 } }}>
          <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 1, bgcolor: '#24543f' }} onClose={() => setMessage('')}>{message}</Alert>
        </Snackbar>
        {error && <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 1, bgcolor: '#fffefa', alignItems: 'center' }} action={
          error.toLowerCase().includes('server') || error.toLowerCase().includes('reach')
            ? <Button color="inherit" size="small" onClick={refresh}>Try again</Button>
            : undefined
        } onClose={() => setError('')}>{error}</Alert>}

        <Box key={view} className="page-enter">
        {loading ? <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}><CircularProgress color="primary" /></Box> : <>
          {view === 'overview' && <OverviewPanel resources={resources} bookings={bookings} onBook={openBooking} onViewBookings={() => setView('bookings')} />}
          {view === 'offices' && <Suspense fallback={<Box sx={{ minHeight: 340, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
            <OfficeLocationsPage allResources={resources} onBook={openBooking} />
          </Suspense>}
          {view === 'bookings' && <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'end' }} spacing={1.5} sx={{ mb: 2.5 }}>
              <Box><Typography variant="h5">Your bookings</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>The spaces you’ve made time for.</Typography></Box>
              <Button onClick={() => openBooking()} variant="outlined" startIcon={<UiIcon name="plus" size={17} />} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>New booking</Button>
            </Stack>
            <BookingList bookings={bookings} onCancel={cancelBooking} />
          </Box>}
          {view === 'admin' && isAdmin && <>
            <Stack spacing={2.5} className="admin-page">
              <Box className="admin-page-hero" sx={{
                position: 'relative', overflow: 'hidden', p: { xs: 2.75, sm: 3.5, md: 4.5 }, borderRadius: 2,
                color: '#f8f6ec', background: 'linear-gradient(115deg, #193d2d 0%, #24543f 66%, #416947 100%)',
                '&::after': {
                  content: '""', position: 'absolute', width: 260, height: 260, right: { xs: -130, sm: -65 }, top: -135,
                  borderRadius: '50%', border: '1px solid rgba(214,242,120,.2)',
                  boxShadow: '0 0 0 28px rgba(214,242,120,.035), 0 0 0 58px rgba(214,242,120,.025)'
                }
              }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ maxWidth: 620 }}>
                    <Chip label="WORKSPACE ADMIN" size="small" sx={{ mb: 1.5, bgcolor: 'rgba(214,242,120,.14)', color: '#d6f278', fontWeight: 800, letterSpacing: 1 }} />
                    <Typography sx={{ fontSize: { xs: 30, sm: 38, md: 44 }, lineHeight: 1.05, fontWeight: 750, letterSpacing: '-.055em' }}>
                      Your workspace, <Box component="span" sx={{ color: '#d6f278' }}>well managed.</Box>
                    </Typography>
                    <Typography sx={{ mt: 1.25, maxWidth: 520, color: 'rgba(248,246,236,.68)', fontSize: 14, lineHeight: 1.7 }}>
                      Keep office locations, shared spaces, and team reservations running smoothly.
                    </Typography>
                  </Box>
                  <Box sx={{ display: { xs: 'none', sm: 'grid' }, flexShrink: 0, width: 62, height: 62, placeItems: 'center', borderRadius: '50%', color: '#d6f278', bgcolor: 'rgba(214,242,120,.1)', border: '1px solid rgba(214,242,120,.18)' }}>
                    <UiIcon name="settings" size={27} />
                  </Box>
                </Stack>
              </Box>

              <Grid container spacing={1.75} className="motion-stagger">
                {adminMetrics.map((metric) => <Grid key={metric.label} size={{ xs: 12, sm: 4 }}>
                  <Card className="motion-card" variant="outlined" sx={{ height: '100%', borderColor: '#e8e6dc', borderRadius: 1.5, bgcolor: '#fffefa', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Box>
                          <Typography sx={{ fontSize: 12, color: '#77796f' }}>{metric.label}</Typography>
                          <Typography sx={{ mt: .75, fontSize: 32, fontWeight: 750, letterSpacing: '-.06em', lineHeight: 1, color: '#232921' }}>{metric.value}</Typography>
                          <Typography sx={{ mt: .75, fontSize: 11, color: '#8c8d83' }}>{metric.note}</Typography>
                        </Box>
                        <Box sx={{ width: 42, height: 42, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', color: metric.ink, bgcolor: metric.tint }}>
                          <UiIcon name={metric.icon} size={19} />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>)}
              </Grid>

              <Grid container spacing={2.5} alignItems="start">
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Stack spacing={1.25}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 1, bgcolor: '#e8ede0', color: '#24543f' }}><UiIcon name="pin" size={17} /></Box>
                      <Box>
                        <Typography sx={{ fontSize: 15, fontWeight: 750, letterSpacing: '-.02em' }}>Office locations</Typography>
                        <Typography sx={{ fontSize: 11, color: '#77796f' }}>Manage addresses and map positions</Typography>
                      </Box>
                    </Stack>
                    <OfficeLocationForm onChanged={refresh} />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Stack spacing={1.25}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 1, bgcolor: '#f5ebe1', color: '#9c6939' }}><UiIcon name="room" size={17} /></Box>
                      <Box>
                        <Typography sx={{ fontSize: 15, fontWeight: 750, letterSpacing: '-.02em' }}>Shared spaces</Typography>
                        <Typography sx={{ fontSize: 11, color: '#77796f' }}>Add spaces and manage office assignments</Typography>
                      </Box>
                    </Stack>
                    <ResourceAdminPanel offices={offices} resources={resources} bookings={allBookings} onCreated={resourceCreated} onAssignmentChanged={resourceAssignmentChanged} />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined" sx={{ borderColor: '#e8e6dc', borderRadius: 1.5, bgcolor: '#fffefa', boxShadow: 'none' }}>
                    <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ mb: 2.25 }}>
                        <Box>
                          <Typography sx={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.025em' }}>Workspace schedule</Typography>
                          <Typography sx={{ mt: .35, fontSize: 12, color: '#77796f' }}>Review reservations across your team.</Typography>
                        </Box>
                        <Chip size="small" label={`${allBookings.length} total`} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, bgcolor: '#f0f2e8', color: '#52604f', fontWeight: 700 }} />
                      </Stack>
                      <BookingList bookings={allBookings} onCancel={cancelBooking} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Stack>
          </>}
        </>}
        </Box>
      </Box>
    </Box>

    <Box component="nav" aria-label="Primary navigation" sx={{ position: 'fixed', display: { xs: 'block', md: 'none' }, zIndex: 1200, bottom: 0, left: 0, right: 0, px: 1, pb: 'max(8px, env(safe-area-inset-bottom))', pt: .5, bgcolor: 'rgba(255,254,250,.96)', borderTop: '1px solid #e9e7de', backdropFilter: 'blur(14px)' }}>
      <NavLinks compact />
    </Box>
    <BookingDialog open={bookingDialog} resources={resources} initialResource={initialResource} initialStart={initialStart} initialEnd={initialEnd} onClose={() => setBookingDialog(false)} onBooked={bookingCreated} />
  </Box>
}
