import { useState } from 'react'
import { addHours } from 'date-fns'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { api, errorMessage } from '../api'
import { parseBookingWindow, parseLocalDateTime, toLocalDateTimeInput } from '../utils/dateTime'

export default function ResourceAvailabilitySearch({
  resources,
  onBook
}) {
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
      const { data } = await api.get('/bookings/availability/resources', {
        params: { start: startUtc, end: endUtc }
      })
      setAvailableResourceIds(data.resourceIds)
    } catch (e) {
      setAvailabilitySearchError(errorMessage(e))
    } finally {
      setSearchingAvailability(false)
    }
  }

  const availableResources = availableResourceIds === null
    ? []
    : resources.filter((resource) => availableResourceIds.includes(resource.id))
  const startDate = parseLocalDateTime(searchStart)

  return <Card variant="outlined" sx={{ mb: 4, borderRadius: 3, bgcolor: '#fbfcfe' }}>
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
            onChange={(value) => {
              setSearchStart(toLocalDateTimeInput(value))
              setAvailableResourceIds(null)
              setAvailabilitySearchError('')
            }}
            minDateTime={new Date(Math.ceil(Date.now() / 300000) * 300000)}
            minutesStep={5} disablePast
            slotProps={{ textField: { fullWidth: true, required: true } }} />
          <DateTimePicker label="End time" value={parseLocalDateTime(searchEnd)}
            format="dd/MM/yyyy hh:mm a"
            onChange={(value) => {
              setSearchEnd(toLocalDateTimeInput(value))
              setAvailableResourceIds(null)
              setAvailabilitySearchError('')
            }}
            minDateTime={startDate ?? new Date(Math.ceil(Date.now() / 300000) * 300000)}
            maxDateTime={startDate ? addHours(startDate, 12) : undefined}
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
            {availableResources.map((resource) => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={resource.id}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>{resource.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{resource.location || 'Location not specified'} · Up to {resource.capacity}</Typography>
                    </Box>
                    <Button size="small" onClick={() => onBook(resource.id, searchStart, searchEnd)}>Book</Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>)}
          </Grid>}
        </Box>}
      </Stack>
    </CardContent>
  </Card>
}
