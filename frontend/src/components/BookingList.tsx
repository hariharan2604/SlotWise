import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import type { Booking } from '../types'
import { formatDateTime } from '../utils/dateTime'

export default function BookingList({ bookings, onCancel }: { bookings: Booking[]; onCancel?: (id: number) => void }) {
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
