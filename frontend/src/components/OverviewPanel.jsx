import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import ResourceAvailabilitySearch from './ResourceAvailabilitySearch'

export default function OverviewPanel({
  resources,
  bookings,
  onBook,
  onViewBookings
}) {
  const activeBookings = bookings.filter((b) => b.status === 'Confirmed' && new Date(b.endUtc).getTime() > Date.now())

  return <>
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {[
        { label: 'Bookable resources', value: resources.length, note: 'Ready to reserve' },
        { label: 'Upcoming bookings', value: activeBookings.length, note: 'Confirmed and ahead' },
        { label: 'Your reservations', value: bookings.length, note: 'All booking history' }
      ].map((item) => <Grid size={{ xs: 12, sm: 4 }} key={item.label}>
        <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            <Typography variant="h3" fontWeight={750} letterSpacing={-1} sx={{ mt: 1, color: '#19354d' }}>{item.value}</Typography>
            <Typography variant="caption" color="text.secondary">{item.note}</Typography>
          </CardContent>
        </Card>
      </Grid>)}
    </Grid>
    <ResourceAvailabilitySearch resources={resources} onBook={onBook} />
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'end' }} spacing={1} sx={{ mb: 2 }}>
      <Box>
        <Typography variant="h5" fontWeight={750} letterSpacing={-0.5}>Find a resource</Typography>
        <Typography variant="body2" color="text.secondary">Choose a space that fits your team and your plans.</Typography>
      </Box>
      <Button onClick={onViewBookings}>View my bookings</Button>
    </Stack>
    {resources.length === 0 ? <Card variant="outlined"><CardContent sx={{ textAlign: 'center', py: 5 }}>
      <Typography fontWeight={650}>No resources are available yet</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Ask a workspace administrator to add the first resource.</Typography>
    </CardContent></Card> : <Grid container spacing={2}>
      {resources.map((resource) => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={resource.id}>
        <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, transition: 'transform .18s, box-shadow .18s', '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 } }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={1.5} sx={{ height: '100%' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.25}>{resource.name}</Typography>
                <Chip size="small" label={`Up to ${resource.capacity}`} variant="outlined" />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>{resource.description || 'A shared workspace resource.'}</Typography>
              <Typography variant="caption" color="text.secondary">{resource.location || 'Location not specified'}</Typography>
              <Button variant="outlined" fullWidth sx={{ mt: 'auto' }} onClick={() => onBook(resource.id)}>Check time & book</Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>)}
    </Grid>}
  </>
}
