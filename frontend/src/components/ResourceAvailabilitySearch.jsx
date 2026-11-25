import { useState } from 'react'
import { addHours } from 'date-fns'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { api, errorMessage } from '../api'
import { parseBookingWindow, parseLocalDateTime, toLocalDateTimeInput } from '../utils/dateTime'
import UiIcon from './UiIcon'

export default function ResourceAvailabilitySearch({ resources, onBook }) {
  const [searchStart, setSearchStart] = useState('')
  const [searchEnd, setSearchEnd] = useState('')
  const [availableResourceIds, setAvailableResourceIds] = useState(null)
  const [searchingAvailability, setSearchingAvailability] = useState(false)
  const [availabilitySearchError, setAvailabilitySearchError] = useState('')

  const findAvailableResources = async () => {
    setAvailabilitySearchError('')
    setAvailableResourceIds(null)
    setSearchingAvailability(true)
    try {
      const { startUtc, endUtc } = parseBookingWindow(searchStart, searchEnd)
      const { data } = await api.get('/bookings/availability/resources', { params: { start: startUtc, end: endUtc } })
      setAvailableResourceIds(data.resourceIds)
    } catch (e) {
      setAvailabilitySearchError(errorMessage(e))
    } finally {
      setSearchingAvailability(false)
    }
  }

  const availableResources = availableResourceIds === null ? [] : resources.filter((resource) => availableResourceIds.includes(resource.id))
  const startDate = parseLocalDateTime(searchStart)

  return <Card variant="outlined" sx={{ borderRadius: 2, border: '1px solid #dfe4d5', bgcolor: '#e9eee1', boxShadow: '0 10px 28px rgba(39,44,35,.045)', overflow: 'hidden' }}>
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 3 }} alignItems={{ md: 'center' }}>
        <Box sx={{ width: { xs: '100%', md: 220 }, flexShrink: 0 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#24543f', color: '#d6f278' }}><UiIcon name="search" size={18} /></Box>
            <Box>
              <Typography sx={{ fontWeight: 750, fontSize: 16, letterSpacing: '-.025em' }}>Find a free space</Typography>
              <Typography sx={{ mt: .2, fontSize: 11, color: '#70776a' }}>Choose your time window</Typography>
            </Box>
          </Stack>
        </Box>
        <Stack component="form" onSubmit={(event) => { event.preventDefault(); void findAvailableResources() }} direction={{ xs: 'column', md: 'row' }} spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <DateTimePicker label="From" value={parseLocalDateTime(searchStart)} format="dd/MM/yyyy hh:mm a"
            onChange={(value) => { setSearchStart(toLocalDateTimeInput(value)); setAvailableResourceIds(null); setAvailabilitySearchError('') }}
            minDateTime={new Date(Math.ceil(Date.now() / 300000) * 300000)} minutesStep={5} disablePast
            slotProps={{ textField: { fullWidth: true, required: true, sx: { minWidth: 0 } } }} />
          <DateTimePicker label="Until" value={parseLocalDateTime(searchEnd)} format="dd/MM/yyyy hh:mm a"
            onChange={(value) => { setSearchEnd(toLocalDateTimeInput(value)); setAvailableResourceIds(null); setAvailabilitySearchError('') }}
            minDateTime={startDate ?? new Date(Math.ceil(Date.now() / 300000) * 300000)}
            maxDateTime={startDate ? addHours(startDate, 12) : undefined} minutesStep={5} disablePast
            slotProps={{ textField: { fullWidth: true, required: true, sx: { minWidth: 0 } } }} />
          <Button type="submit" variant="contained" disabled={searchingAvailability || !resources.length || !searchStart || !searchEnd}
            endIcon={!searchingAvailability && <UiIcon name="arrow" size={16} />}
            sx={{ minWidth: { md: 155 }, flexShrink: 0, bgcolor: '#24543f', '&:hover': { bgcolor: '#193d2d' } }}>
            {searchingAvailability ? <CircularProgress size={20} color="inherit" /> : 'Show spaces'}
          </Button>
        </Stack>
      </Stack>
      {availabilitySearchError && <Alert severity="error" variant="outlined" sx={{ mt: 2, borderRadius: 1 }} onClose={() => setAvailabilitySearchError('')}>{availabilitySearchError}</Alert>}
      {availableResourceIds !== null && <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #d9e0d0' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 750 }}>{availableResources.length ? `${availableResources.length} space${availableResources.length === 1 ? '' : 's'} open` : 'Nothing free for that window'}</Typography>
            <Typography sx={{ mt: .25, fontSize: 11, color: '#70776a' }}>{availableResources.length ? 'Pick one to continue with your reservation.' : 'Try a different time to see what else is available.'}</Typography>
          </Box>
        </Stack>
        {availableResources.length > 0 && <Grid container spacing={1}>
          {availableResources.map((resource) => <Grid size={{ xs: 12, md: 6, lg: 4 }} key={resource.id}>
            <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: '#d9e0d0', bgcolor: '#fffefa', boxShadow: 'none' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 750 }} noWrap>{resource.name}</Typography>
                    <Typography sx={{ mt: .35, fontSize: 10, color: '#77796f' }}>Resource: {resource.location || 'Location not specified'}</Typography>
                    <Typography sx={{ mt: .2, fontSize: 10, color: '#77796f' }}>Office location: {resource.officeLocationName || 'No office assigned'} · Up to {resource.capacity}</Typography>
                  </Box>
                  <Button size="small" onClick={() => onBook(resource.id, searchStart, searchEnd)} endIcon={<UiIcon name="arrow" size={14} />} sx={{ color: '#24543f', px: 1 }}>Book</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>)}
        </Grid>}
      </Box>}
    </CardContent>
  </Card>
}
