import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { api, errorMessage } from '../api'
import OfficeLocationSidebar from './OfficeLocationSidebar'
import OfficeMap from './OfficeMap'
import OfficeResourceList from './OfficeResourceList'

export default function OfficeLocationsPage({ onBook }) {
  const [locations, setLocations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [resources, setResources] = useState([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [loadingResources, setLoadingResources] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [resourceError, setResourceError] = useState('')

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedId) ?? null,
    [locations, selectedId]
  )

  useEffect(() => {
    let active = true
    api.get('/office-locations')
      .then(({ data }) => {
        if (!active) return
        const valid = data.filter((location) =>
          Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude)) &&
          Number(location.latitude) >= -90 && Number(location.latitude) <= 90 &&
          Number(location.longitude) >= -180 && Number(location.longitude) <= 180)
        setLocations(valid)
        setSelectedId(valid[0]?.id ?? null)
        if (valid.length !== data.length) setLocationError('Some office locations have invalid coordinates and were not shown on the map.')
      })
      .catch((error) => { if (active) setLocationError(errorMessage(error)) })
      .finally(() => { if (active) setLoadingLocations(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedLocation) {
      setResources([])
      return
    }
    let active = true
    setResources([])
    setLoadingResources(true)
    setResourceError('')
    api.get(`/office-locations/${selectedLocation.id}/resources`)
      .then(({ data }) => { if (active) setResources(data) })
      .catch((error) => { if (active) setResourceError(errorMessage(error)) })
      .finally(() => { if (active) setLoadingResources(false) })
    return () => { active = false }
  }, [selectedLocation])

  const selectOffice = (location) => setSelectedId(location.id)
  const checkAvailability = async (id, start, end) => {
    try {
      const { data } = await api.get(`/office-locations/${id}/resources/availability`, { params: { start, end } })
      return data
    } catch (error) {
      throw new Error(errorMessage(error))
    }
  }

  return <Box>
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'end' }} justifyContent="space-between" spacing={1} sx={{ mb: 2.5 }}>
      <Box>
        <Typography variant="h5">Explore Office Locations</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
          Find an office, discover its resources, and plan your visit.
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">Map data provided by OpenStreetMap</Typography>
    </Stack>
    {locationError && <Alert severity={locations.length ? 'warning' : 'error'} sx={{ mb: 2 }}>{locationError}</Alert>}
    {loadingLocations ? <Box sx={{ minHeight: 340, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> :
      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 8 }}>
          <OfficeMap locations={locations} selectedLocation={selectedLocation} onSelect={selectOffice} onViewResources={selectOffice} />
          {selectedLocation && <OfficeResourceList
            location={selectedLocation}
            resources={resources}
            loading={loadingResources}
            error={resourceError}
            onCheckAvailability={checkAvailability}
            onBook={onBook}
          />}
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <OfficeLocationSidebar
            locations={locations}
            selectedId={selectedId}
            onSelect={selectOffice}
            onViewResources={selectOffice}
          />
        </Grid>
      </Grid>}
  </Box>
}
