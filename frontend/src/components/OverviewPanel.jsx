import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import ResourceAvailabilitySearch from './ResourceAvailabilitySearch'
import UiIcon from './UiIcon'

const resourceTones = [
  { bg: '#e5ecd9', ink: '#24543f', accent: '#c4df8a' },
  { bg: '#f1e4d7', ink: '#8a5933', accent: '#e7bf91' },
  { bg: '#e1e9e9', ink: '#3e6864', accent: '#a9cfca' },
  { bg: '#e9e3ed', ink: '#6e5679', accent: '#c7aed4' }
]

export default function OverviewPanel({ resources, bookings, onBook, onViewBookings }) {
  const activeBookings = bookings.filter((booking) => booking.status === 'Confirmed' && new Date(booking.endUtc).getTime() > Date.now())
  const metrics = [
    { label: 'Spaces to explore', value: resources.length, note: 'Ready when you are', icon: 'room' },
    { label: 'Coming up', value: activeBookings.length, note: 'Your next reservations', icon: 'calendar' },
    { label: 'On your calendar', value: bookings.length, note: 'All-time bookings', icon: 'check' }
  ]

  return <Stack spacing={4}>
    <Grid container spacing={1.75}>
      {metrics.map((item, index) => <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
        <Card variant="outlined" sx={{ height: '100%', border: '1px solid #e8e6dc', borderRadius: 1, bgcolor: '#fffefa', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="start">
              <Box>
                <Typography sx={{ fontSize: 12, color: '#77796f' }}>{item.label}</Typography>
                <Typography sx={{ mt: 1.2, fontSize: 34, fontWeight: 750, lineHeight: 1, letterSpacing: '-.06em', color: '#232921' }}>{item.value}</Typography>
                <Typography sx={{ mt: .9, fontSize: 11, color: '#8c8d83' }}>{item.note}</Typography>
              </Box>
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', color: ['#24543f', '#9c6939', '#69734a'][index], bgcolor: ['#edf1e4', '#f5ebe1', '#eff0e5'][index] }}>
                <UiIcon name={item.icon} size={19} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>)}
    </Grid>

    <ResourceAvailabilitySearch resources={resources} onBook={onBook} />

    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'end' }} spacing={1.5} sx={{ mb: 2.2 }}>
        <Box>
          <Typography variant="h5">Spaces with a little something</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .55 }}>Rooms, equipment, and places to bring people together.</Typography>
        </Box>
        <Button onClick={onViewBookings} endIcon={<UiIcon name="arrow" size={16} />} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' }, color: '#24543f' }}>Your bookings</Button>
      </Stack>
      {resources.length === 0 ? <Card variant="outlined" sx={{ borderRadius: 1, borderStyle: 'dashed', boxShadow: 'none' }}>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ mx: 'auto', mb: 2, width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#e8ede0', color: '#24543f' }}><UiIcon name="room" size={24} /></Box>
          <Typography fontWeight={700}>The first space is waiting to be added</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .6 }}>Ask your workspace admin to make a resource available.</Typography>
        </CardContent>
      </Card> : <Grid container spacing={2}>
        {resources.map((resource, index) => {
          const tone = resourceTones[index % resourceTones.length]
          const isRoom = /room|conference|meeting/i.test(resource.name)
          return <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={resource.id}>
            <Card sx={{ height: '100%', border: '1px solid #e9e7de', borderRadius: 1, bgcolor: '#fffefa', overflow: 'hidden', boxShadow: '0 6px 24px rgba(39,44,35,.035)', transition: 'transform .2s ease, box-shadow .2s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 38px rgba(39,44,35,.10)' } }}>
              <Box sx={{ height: 148, position: 'relative', overflow: 'hidden', bgcolor: tone.bg, color: tone.ink }}>
                <Box sx={{ position: 'absolute', right: -25, top: -55, width: 195, height: 195, borderRadius: '50%', bgcolor: tone.accent, opacity: .6 }} />
                <Box sx={{ position: 'absolute', right: 38, top: 22, width: 112, height: 112, borderRadius: '50%', border: `1px solid ${tone.ink}35` }} />
                <Box sx={{ position: 'absolute', right: 59, top: 43, width: 70, height: 70, borderRadius: '50%', border: `1px solid ${tone.ink}35` }} />
                <Box sx={{ position: 'absolute', left: 22, bottom: 17, width: 52, height: 52, borderRadius: 1, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,254,250,.72)' }}>
                  <UiIcon name={isRoom ? 'room' : 'sparkle'} size={24} />
                </Box>
                <Typography sx={{ position: 'absolute', top: 18, left: 22, fontSize: 10, fontWeight: 800, letterSpacing: 1.6, opacity: .75 }}>SPACE {String(index + 1).padStart(2, '0')}</Typography>
                <Chip size="small" label="AVAILABLE" sx={{ position: 'absolute', top: 16, right: 16, color: tone.ink, bgcolor: 'rgba(255,254,250,.8)', fontSize: 9, letterSpacing: .6 }} />
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.8}>
                  <Box>
                    <Typography sx={{ fontSize: 19, fontWeight: 750, letterSpacing: '-.035em', color: '#252a23' }}>{resource.name}</Typography>
                    <Stack direction="row" spacing={.7} alignItems="center" sx={{ mt: .7, color: '#818278' }}>
                      <UiIcon name="pin" size={14} /><Typography variant="caption">{resource.location || 'Location to be confirmed'}</Typography>
                    </Stack>
                  </Box>
                  <Typography sx={{ minHeight: 38, fontSize: 12, lineHeight: 1.65, color: '#77796f' }}>{resource.description || 'A shared space, ready for your next big idea.'}</Typography>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 1.5, borderTop: '1px solid #efeee7' }}>
                    <Stack direction="row" spacing={.7} alignItems="center" sx={{ color: '#77796f' }}>
                      <UiIcon name="users" size={15} /><Typography variant="caption">Up to {resource.capacity}</Typography>
                    </Stack>
                    <Button onClick={() => onBook(resource.id)} endIcon={<UiIcon name="arrow" size={15} />} sx={{ minHeight: 36, px: 1.4, bgcolor: '#24543f', color: '#fffefa', '&:hover': { bgcolor: '#193d2d' } }}>Reserve</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        })}
      </Grid>}
    </Box>
  </Stack>
}
