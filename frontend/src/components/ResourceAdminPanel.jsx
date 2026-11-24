import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { api, errorMessage } from '../api'
import UiIcon from './UiIcon'

export default function ResourceAdminPanel({ offices, resources, bookings, onCreated, onAssignmentChanged }) {
  const [savingResource, setSavingResource] = useState(false)
  const [resourceName, setResourceName] = useState('')
  const [resourceDescription, setResourceDescription] = useState('')
  const [resourceLocation, setResourceLocation] = useState('')
  const [resourceCapacity, setResourceCapacity] = useState('1')
  const [resourceOfficeId, setResourceOfficeId] = useState('')
  const [assignments, setAssignments] = useState({})
  const [savingAssignmentId, setSavingAssignmentId] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [bookingDecision, setBookingDecision] = useState(null)

  const assignResource = async (resource, officeLocationId, existingBookingsAction = null) => {
    setFormError('')
    setSavingAssignmentId(resource.id)
    try {
      await api.put(`/resources/${resource.id}/office-location`, {
        officeLocationId,
        existingBookingsAction
      })
      setBookingDecision(null)
      await onAssignmentChanged()
    } catch (e) {
      setFormError(errorMessage(e))
    } finally {
      setSavingAssignmentId(null)
    }
  }

  const requestOfficeAssignment = async (resource) => {
    const selected = assignments[resource.id] ?? String(resource.officeLocationId ?? '')
    const officeLocationId = selected === '' ? null : Number(selected)
    if (officeLocationId === resource.officeLocationId) return

    const futureBookingCount = bookings.filter((booking) =>
      booking.resourceId === resource.id &&
      booking.status === 'Confirmed' &&
      new Date(booking.startUtc).getTime() > Date.now()
    ).length

    if (futureBookingCount > 0) {
      setBookingDecision({
        resource,
        officeLocationId,
        futureBookingCount,
        officeName: offices.find((office) => office.id === officeLocationId)?.name ?? null
      })
      return
    }

    await assignResource(resource, officeLocationId)
  }

  const createResource = async () => {
    setFormError('')
    setFieldErrors({})
    const capacity = Number(resourceCapacity)
    const nextErrors = {}
    if (!resourceName.trim()) nextErrors.name = 'Enter a resource name.'
    else if (resourceName.trim().length > 120) nextErrors.name = 'Name cannot exceed 120 characters.'
    if (resourceDescription.length > 500) nextErrors.description = 'Description cannot exceed 500 characters.'
    if (resourceLocation.length > 150) nextErrors.location = 'Location cannot exceed 150 characters.'
    if (!Number.isInteger(capacity) || capacity < 1) nextErrors.capacity = 'Enter a positive whole number.'
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      return
    }

    setSavingResource(true)
    try {
      await api.post('/resources', {
        name: resourceName.trim(),
        description: resourceDescription.trim(),
        location: resourceLocation.trim(),
        capacity,
        officeLocationId: resourceOfficeId ? Number(resourceOfficeId) : null
      })
      setResourceName('')
      setResourceDescription('')
      setResourceLocation('')
      setResourceCapacity('1')
      setResourceOfficeId('')
      await onCreated()
    } catch (e) {
      setFormError(errorMessage(e))
    } finally {
      setSavingResource(false)
    }
  }

  return <Card variant="outlined" sx={{ borderRadius: 1, borderColor: '#e8e6dc', bgcolor: '#fffefa', boxShadow: 'none' }}>
    <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
      <Box sx={{ width: 44, height: 44, mb: 2, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#e8ede0', color: '#24543f' }}><UiIcon name="plus" size={21} /></Box>
      <Typography variant="h6">Add a shared space</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2.5, lineHeight: 1.65 }}>Give your team somewhere useful to meet, make, or focus.</Typography>
      <Stack spacing={1.75}>
        {Object.keys(fieldErrors).length > 0 && <Alert severity="error" variant="outlined" sx={{ borderRadius: 1 }}>Complete the highlighted fields.</Alert>}
        {formError && <Alert severity="error" variant="outlined" sx={{ borderRadius: 1 }} onClose={() => setFormError('')}>{formError}</Alert>}
        <TextField label="Space name" value={resourceName} onChange={e => { setResourceName(e.target.value); setFieldErrors(previous => ({ ...previous, name: '' })) }} error={Boolean(fieldErrors.name)} helperText={fieldErrors.name} inputProps={{ maxLength: 120 }} required />
        <TextField label="A short description" value={resourceDescription} onChange={e => { setResourceDescription(e.target.value); setFieldErrors(previous => ({ ...previous, description: '' })) }} error={Boolean(fieldErrors.description)} helperText={fieldErrors.description} inputProps={{ maxLength: 500 }} multiline minRows={3} />
        <TextField label="Where can we find it?" value={resourceLocation} onChange={e => { setResourceLocation(e.target.value); setFieldErrors(previous => ({ ...previous, location: '' })) }} error={Boolean(fieldErrors.location)} helperText={fieldErrors.location} inputProps={{ maxLength: 150 }} />
        <TextField label="Capacity" type="number" value={resourceCapacity} onChange={e => { setResourceCapacity(e.target.value); setFieldErrors(previous => ({ ...previous, capacity: '' })) }} error={Boolean(fieldErrors.capacity)} helperText={fieldErrors.capacity} inputProps={{ min: 1, step: 1 }} required />
        <TextField select label="Office location" value={resourceOfficeId} onChange={e => setResourceOfficeId(e.target.value)}>
          <MenuItem value="">Not assigned to an office</MenuItem>
          {offices.filter(office => office.isActive).map(office => <MenuItem key={office.id} value={office.id}>{office.name}</MenuItem>)}
        </TextField>
        <Button variant="contained" onClick={createResource} disabled={savingResource} endIcon={!savingResource && <UiIcon name="arrow" size={17} />} sx={{ mt: .5, bgcolor: '#24543f', '&:hover': { bgcolor: '#193d2d' } }}>
          {savingResource ? <CircularProgress size={22} color="inherit" /> : 'Add resource'}
        </Button>
      </Stack>
      <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #efeee7' }}>
        <Typography fontWeight={700} sx={{ mb: 1 }}>Assign existing resources</Typography>
        <Stack spacing={1}>
          {resources.map((resource) => <Stack key={resource.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <Typography variant="body2" sx={{ flex: 1 }}>{resource.name}</Typography>
            <TextField select size="small" label="Office" value={assignments[resource.id] ?? String(resource.officeLocationId ?? '')}
              onChange={(event) => setAssignments(current => ({ ...current, [resource.id]: event.target.value }))} sx={{ minWidth: 180 }}>
              <MenuItem value="">No office</MenuItem>
              {offices.filter(office => office.isActive).map(office => <MenuItem key={office.id} value={String(office.id)}>{office.name}</MenuItem>)}
            </TextField>
            <Button size="small" disabled={savingAssignmentId === resource.id}
              onClick={() => requestOfficeAssignment(resource)}>
              {savingAssignmentId === resource.id ? <CircularProgress size={18} /> : 'Save'}
            </Button>
          </Stack>)}
        </Stack>
      </Box>
    </CardContent>
    <Dialog open={Boolean(bookingDecision)} onClose={() => {
      if (savingAssignmentId === null) setBookingDecision(null)
    }}>
      <DialogTitle>Existing bookings for {bookingDecision?.resource.name}</DialogTitle>
      <DialogContent>
        <Typography>
          This resource has {bookingDecision?.futureBookingCount} future confirmed booking(s).
          {bookingDecision?.officeName
            ? ` Its new office will be ${bookingDecision.officeName}.`
            : ' It will no longer be assigned to an office.'}
          Choose how to handle those bookings.
        </Typography>
        {formError && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setFormError('')}>{formError}</Alert>}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', p: 2 }}>
        <Button onClick={() => setBookingDecision(null)} disabled={savingAssignmentId !== null}>Keep current office</Button>
        <Button
          color="error"
          disabled={savingAssignmentId !== null}
          onClick={() => assignResource(bookingDecision.resource, bookingDecision.officeLocationId, 'Cancel')}
        >
          Cancel affected bookings
        </Button>
        <Button
          variant="contained"
          disabled={savingAssignmentId !== null}
          onClick={() => assignResource(bookingDecision.resource, bookingDecision.officeLocationId, 'MoveWithResource')}
        >
          {savingAssignmentId === bookingDecision?.resource.id
            ? <CircularProgress size={18} color="inherit" />
            : 'Move bookings with resource'}
        </Button>
      </DialogActions>
    </Dialog>
  </Card>
}
