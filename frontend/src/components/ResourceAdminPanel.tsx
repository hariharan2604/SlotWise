import { useState } from 'react'
import { Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { api, errorMessage } from '../api'

export default function ResourceAdminPanel({
  onCreated,
  onError
}: {
  onCreated: () => Promise<void>
  onError: (message: string) => void
}) {
  const [savingResource, setSavingResource] = useState(false)
  const [resourceName, setResourceName] = useState('')
  const [resourceDescription, setResourceDescription] = useState('')
  const [resourceLocation, setResourceLocation] = useState('')
  const [resourceCapacity, setResourceCapacity] = useState('1')

  const createResource = async () => {
    onError('')
    setSavingResource(true)
    try {
      const capacity = Number(resourceCapacity)
      if (!resourceName.trim() || resourceName.trim().length > 120) throw new Error('Enter a resource name (up to 120 characters).')
      if (resourceDescription.length > 500) throw new Error('Description must be 500 characters or fewer.')
      if (resourceLocation.length > 150) throw new Error('Location must be 150 characters or fewer.')
      if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Capacity must be a positive whole number.')
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
      onError(errorMessage(e))
    } finally {
      setSavingResource(false)
    }
  }

  return <Card variant="outlined" sx={{ borderRadius: 3 }}>
    <CardContent sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={750}>Add a workspace resource</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Create a room, shared space, or piece of equipment for people to reserve.</Typography>
      <Stack spacing={2}>
        <TextField label="Resource name" value={resourceName} onChange={e => setResourceName(e.target.value)} inputProps={{ maxLength: 120 }} required />
        <TextField label="Description" value={resourceDescription} onChange={e => setResourceDescription(e.target.value)} inputProps={{ maxLength: 500 }} multiline minRows={2} />
        <TextField label="Location" value={resourceLocation} onChange={e => setResourceLocation(e.target.value)} inputProps={{ maxLength: 150 }} />
        <TextField label="Capacity" type="number" value={resourceCapacity} onChange={e => setResourceCapacity(e.target.value)} inputProps={{ min: 1, step: 1 }} required />
        <Button variant="contained" onClick={createResource} disabled={savingResource}>
          {savingResource ? <CircularProgress size={22} color="inherit" /> : 'Add resource'}
        </Button>
      </Stack>
    </CardContent>
  </Card>
}
