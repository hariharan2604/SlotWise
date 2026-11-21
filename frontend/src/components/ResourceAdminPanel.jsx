import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { api, errorMessage } from '../api'
import UiIcon from './UiIcon'

export default function ResourceAdminPanel({ onCreated }) {
  const [savingResource, setSavingResource] = useState(false)
  const [resourceName, setResourceName] = useState('')
  const [resourceDescription, setResourceDescription] = useState('')
  const [resourceLocation, setResourceLocation] = useState('')
  const [resourceCapacity, setResourceCapacity] = useState('1')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')

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
        capacity
      })
      setResourceName('')
      setResourceDescription('')
      setResourceLocation('')
      setResourceCapacity('1')
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
        <Button variant="contained" onClick={createResource} disabled={savingResource} endIcon={!savingResource && <UiIcon name="arrow" size={17} />} sx={{ mt: .5, bgcolor: '#24543f', '&:hover': { bgcolor: '#193d2d' } }}>
          {savingResource ? <CircularProgress size={22} color="inherit" /> : 'Add resource'}
        </Button>
      </Stack>
    </CardContent>
  </Card>
}
