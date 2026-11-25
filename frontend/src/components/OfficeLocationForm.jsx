import { lazy, Suspense, useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress, FormControlLabel, Grid, Stack, TextField, Typography } from '@mui/material'
import { api, errorMessage } from '../api'

const emptyForm = {
  name: '', address: '', city: '', state: '', country: '',
  latitude: '', longitude: '', description: '', isActive: true
}

const OfficeCoordinatePicker = lazy(() => import('./OfficeCoordinatePicker'))

export default function OfficeLocationForm({ onChanged }) {
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  const loadLocations = async () => {
    const { data } = await api.get('/office-locations')
    setLocations(data)
  }

  useEffect(() => {
    loadLocations().catch((e) => setError(errorMessage(e))).finally(() => setLoading(false))
  }, [])

  const setField = (field) => (event) => setForm((current) => ({
    ...current,
    [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
  }))

  const useBrowserLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('This browser does not support location services.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }))
        setLocating(false)
      },
      (locationError) => {
        const message = locationError.code === locationError.PERMISSION_DENIED
          ? 'Location permission was denied. Allow location access in your browser settings and try again.'
          : locationError.code === locationError.POSITION_UNAVAILABLE
            ? 'Your browser could not determine the current location.'
            : 'The browser location request timed out. Try again.'
        setError(message)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }

  const reset = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  const edit = (location) => {
    setEditingId(location.id)
    setForm({
      name: location.name, address: location.address, city: location.city, state: location.state ?? '',
      country: location.country, latitude: String(location.latitude), longitude: String(location.longitude),
      description: location.description ?? '', isActive: location.isActive
    })
    setError('')
  }

  const save = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.latitude.trim() || !form.longitude.trim()) {
      setError('Choose a point on the map or enter both coordinates.')
      return
    }
    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setError('Latitude must be between -90 and 90.')
      return
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError('Longitude must be between -180 and 180.')
      return
    }

    setSaving(true)
    try {
      const payload = { ...form, latitude, longitude }
      if (editingId) await api.put(`/office-locations/${editingId}`, payload)
      else await api.post('/office-locations', payload)
      reset()
      await loadLocations()
      await onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (location) => {
    if (!window.confirm(`Deactivate ${location.name}? Employees will no longer see it.`)) return
    setError('')
    try {
      await api.delete(`/office-locations/${location.id}`)
      await loadLocations()
      await onChanged()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return <Stack spacing={2.5}>
    <Card variant="outlined" sx={{ borderColor: '#e8e6dc', borderRadius: 2, bgcolor: '#fffefa', boxShadow: '0 8px 26px rgba(39,44,35,.035)' }}>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Typography sx={{ mb: .65, color: '#718a49', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>Office setup</Typography>
        <Typography variant="h6">{editingId ? 'Edit office location' : 'Add an office location'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2.5 }}>
          Enter the address details manually, or use browser location to fill the coordinates.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Stack component="form" onSubmit={save} spacing={2}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ pb: 1, borderBottom: '1px solid #efeee7', color: '#555e53', fontSize: 12, fontWeight: 750 }}>Address details</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Office name" value={form.name} onChange={setField('name')} inputProps={{ maxLength: 120 }} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Country" value={form.country} onChange={setField('country')} inputProps={{ maxLength: 120 }} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth required label="Address" value={form.address} onChange={setField('address')} inputProps={{ maxLength: 250 }} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="City" value={form.city} onChange={setField('city')} inputProps={{ maxLength: 120 }} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="State / region" value={form.state} onChange={setField('state')} inputProps={{ maxLength: 120 }} /></Grid>
            <Grid size={{ xs: 12 }} sx={{ pt: '8px!important' }}>
              <Typography sx={{ pb: 1, borderBottom: '1px solid #efeee7', color: '#555e53', fontSize: 12, fontWeight: 750 }}>Choose this office on the map</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Pan and zoom to the office, then select the map to set its coordinates.
                </Typography>
                <Suspense fallback={<Box className="office-coordinate-picker" sx={{ display: 'grid', placeItems: 'center', color: 'text.secondary' }}>Loading map…</Box>}>
                  <OfficeCoordinatePicker
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onSelect={({ latitude, longitude }) => setForm((current) => ({ ...current, latitude, longitude }))}
                  />
                </Suspense>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required type="number" label="Latitude" value={form.latitude} onChange={setField('latitude')} inputProps={{ min: -90, max: 90, step: 'any' }} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required type="number" label="Longitude" value={form.longitude} onChange={setField('longitude')} inputProps={{ min: -180, max: 180, step: 'any' }} /></Grid>
            <Grid size={{ xs: 12 }}>
              <Button type="button" variant="outlined" onClick={useBrowserLocation} disabled={locating} sx={{ borderRadius: 2 }}>
                {locating ? <CircularProgress size={18} color="inherit" /> : 'Use browser location'}
              </Button>
            </Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth multiline minRows={2} label="Description" value={form.description} onChange={setField('description')} inputProps={{ maxLength: 1000 }} /></Grid>
          </Grid>
          {editingId && <FormControlLabel control={<Checkbox checked={form.isActive} onChange={setField('isActive')} />} label="Active and visible to employees" />}
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end" sx={{ pt: 2, borderTop: '1px solid #efeee7' }}>
            {editingId && <Button onClick={reset} color="inherit" sx={{ color: '#77796f' }}>Cancel</Button>}
            <Button type="submit" variant="contained" disabled={saving} sx={{ minWidth: 150 }}>
              {saving ? <CircularProgress size={20} color="inherit" /> : editingId ? 'Save changes' : 'Add office'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>

    <Card variant="outlined" sx={{ borderColor: '#e8e6dc', borderRadius: 2, bgcolor: '#fffefa', boxShadow: 'none' }}>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Registered offices</Typography>
        {loading ? <CircularProgress size={22} /> : locations.length === 0 ?
          <Typography variant="body2" color="text.secondary">No office locations have been registered.</Typography> :
          <Stack spacing={1}>
            {locations.map((location) => <Box key={location.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid #eeede6', borderRadius: 1.5, transition: 'border-color .18s ease, background-color .18s ease', '&:hover': { borderColor: '#cdd5c4', bgcolor: '#fcfcf8' } }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} noWrap>{location.name}</Typography>
                <Typography variant="caption" color="text.secondary">{location.city}, {location.country} · {location.resourceCount} resources · {location.isActive ? 'Active' : 'Inactive'}</Typography>
              </Box>
              <Stack direction="row" spacing={.5}>
                <Button size="small" onClick={() => edit(location)}>Edit</Button>
                {location.isActive && <Button size="small" color="error" onClick={() => deactivate(location)}>Deactivate</Button>}
              </Stack>
            </Box>)}
          </Stack>}
      </CardContent>
    </Card>
  </Stack>
}
