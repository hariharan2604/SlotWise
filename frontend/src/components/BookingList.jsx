import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import { formatDateTime } from '../utils/dateTime'
import UiIcon from './UiIcon'

export default function BookingList({ bookings, onCancel }) {
  if (!bookings.length) {
    return <Card variant="outlined" sx={{ borderRadius: 1, borderStyle: 'dashed', bgcolor: '#fffefa', boxShadow: 'none' }}>
      <CardContent sx={{ py: 7, textAlign: 'center' }}>
        <Box sx={{ mx: 'auto', mb: 2, width: 58, height: 58, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#e8ede0', color: '#24543f' }}><UiIcon name="calendar" size={25} /></Box>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Nothing on the calendar just yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .6 }}>When you reserve a space, it will show up here.</Typography>
      </CardContent>
    </Card>
  }

  return <Stack spacing={1.5}>
    {bookings.map((booking) => {
      const start = new Date(booking.startUtc)
      const canCancel = booking.status === 'Confirmed' && start.getTime() > Date.now()
      const dateNumber = Number.isNaN(start.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { day: '2-digit' }).format(start)
      const dateMonth = Number.isNaN(start.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { month: 'short' }).format(start)
      return <Card key={booking.id} variant="outlined" sx={{ border: '1px solid #e9e7de', borderRadius: 1, bgcolor: '#fffefa', boxShadow: 'none' }}>
        <CardContent sx={{ p: { xs: 1.75, sm: 2.5 }, '&:last-child': { pb: { xs: 1.75, sm: 2.5 } } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Stack direction="row" spacing={1.75} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ flexShrink: 0, width: 54, height: 62, borderRadius: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: booking.status === 'Confirmed' ? '#e8ede0' : '#f0efea', color: booking.status === 'Confirmed' ? '#24543f' : '#77796f' }}>
                <Typography sx={{ fontSize: 22, lineHeight: 1, fontWeight: 750, letterSpacing: '-.05em' }}>{dateNumber}</Typography>
                <Typography sx={{ mt: .3, fontSize: 10, textTransform: 'uppercase', fontWeight: 800, letterSpacing: .7 }}>{dateMonth}</Typography>
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography sx={{ fontWeight: 750, fontSize: 16, letterSpacing: '-.025em' }}>{booking.resourceName}</Typography>
                  <Chip size="small" label={booking.status} color={booking.status === 'Confirmed' ? 'success' : 'default'} />
                </Stack>
                <Typography sx={{ mt: .45, fontSize: 12, color: '#77796f' }}>{booking.purpose || 'Workspace reservation'}</Typography>
                {booking.officeLocationName && <Typography sx={{ mt: .45, fontSize: 11, color: '#77796f' }}>
                  Office: {booking.officeLocationName}
                </Typography>}
                {booking.bookedBy && <Typography sx={{ mt: .45, fontSize: 11, color: '#92938a' }}>Reserved by {booking.bookedBy}</Typography>}
              </Box>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ pl: { sm: 1 } }}>
              <Stack direction="row" spacing={.8} alignItems="center" sx={{ color: '#555b51' }}>
                <Box sx={{ color: '#718a49', display: 'flex' }}><UiIcon name="clock" size={16} /></Box>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{formatDateTime(booking.startUtc)}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#898b80' }}>until {formatDateTime(booking.endUtc)}</Typography>
                </Box>
              </Stack>
              {canCancel && <Button onClick={() => onCancel(booking.id)} size="small" sx={{ minWidth: 0, color: '#a94b3f', px: 1.2, '&:hover': { bgcolor: '#fbefec' } }}>Cancel</Button>}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    })}
  </Stack>
}
