import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import UiIcon from './UiIcon'

function resourceType(resource) {
  const description = `${resource.name} ${resource.description}`.toLowerCase()
  if (/meeting|conference|room/.test(description)) return 'Meeting rooms'
  if (/workstation|desk|work space|workspace/.test(description)) return 'Workstations'
  if (/equipment|projector|monitor|printer/.test(description)) return 'Equipment'
  return 'Other'
}

export default function OfficeResourceList({ location, resources, loading, error, onCheckAvailability, onBook }) {
  const [type, setType] = useState('All')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [availability, setAvailability] = useState(null)
  const [availabilityError, setAvailabilityError] = useState('')
  const [checking, setChecking] = useState(false)
  const typeOptions = useMemo(() => ['All', ...new Set(resources.map(resourceType))], [resources])
  const visibleResources = resources.filter((resource) => type === 'All' || resourceType(resource) === type)
  const canCheck = Boolean(start && end && new Date(end) > new Date(start))

  useEffect(() => {
    setAvailability(null)
  }, [location.id, start, end])

  const checkAvailability = async () => {
    setChecking(true)
    setAvailabilityError('')
    try {
      const results = await onCheckAvailability(location.id, new Date(start).toISOString(), new Date(end).toISOString())
      setAvailability(Object.fromEntries(results.map((item) => [item.resource.id, item.available])))
    } catch (e) {
      setAvailabilityError(e?.message ?? String(e))
    } finally {
      setChecking(false)
    }
  }

  return <Card variant="outlined" sx={{ mt: 2, borderColor: '#e8e6dc', borderRadius: 1, bgcolor: '#fffefa', boxShadow: 'none' }}>
    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6">{location.name} resources</Typography>
          <Typography variant="body2" color="text.secondary">{resources.length} active resource{resources.length === 1 ? '' : 's'}</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="office-resource-type-label">Resource type</InputLabel>
          <Select labelId="office-resource-type-label" value={type} label="Resource type" onChange={(event) => setType(event.target.value)}>
            {typeOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <TextField label="From" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)}
          InputLabelProps={{ shrink: true }} size="small" />
        <TextField label="Until" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)}
          InputLabelProps={{ shrink: true }} size="small" />
        <Button variant="outlined" disabled={!canCheck || checking} onClick={checkAvailability}>
          {checking ? 'Checking…' : 'Check availability'}
        </Button>
      </Stack>
      {availabilityError && <Alert severity="error" sx={{ mb: 1.5 }}>{availabilityError}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {loading ? <Typography color="text.secondary">Loading resources…</Typography> :
        visibleResources.length === 0 ? <Typography color="text.secondary">No resources match this type.</Typography> :
          <Grid container spacing={1.25}>
            {visibleResources.map((resource) => {
              const isAvailable = availability?.[resource.id]
              return <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={resource.id}>
                <Card variant="outlined" sx={{ height: '100%', borderColor: '#eeede6', borderRadius: 1, boxShadow: 'none' }}>
                  <CardContent sx={{ p: 1.6 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="start" justifyContent="space-between" spacing={1}>
                        <Typography fontWeight={750}>{resource.name}</Typography>
                        {availability && <Chip size="small" label={isAvailable ? 'Available' : 'Booked'}
                          color={isAvailable ? 'success' : 'default'} />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {resource.location || 'Location to be confirmed'} · Up to {resource.capacity}
                      </Typography>
                      {resource.description && <Typography variant="body2" color="text.secondary">{resource.description}</Typography>}
                      <Button onClick={() => onBook(resource.id, start, end)} disabled={availability && !isAvailable}
                        variant="contained" size="small" endIcon={<UiIcon name="arrow" size={14} />}>
                        Book resource
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            })}
          </Grid>}
    </CardContent>
  </Card>
}
