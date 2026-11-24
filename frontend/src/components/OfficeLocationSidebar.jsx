import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import UiIcon from './UiIcon'

function directionsUrl(location) {
  return `https://www.openstreetmap.org/directions?to=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`
}

export default function OfficeLocationSidebar({ locations, selectedId, onSelect, onViewResources }) {
  return <Card variant="outlined" sx={{ height: '100%', borderColor: '#e8e6dc', borderRadius: 1, bgcolor: '#fffefa', boxShadow: 'none' }}>
    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Typography variant="h6">Office locations</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: .4, mb: 1.5 }}>
        {locations.length} active office{locations.length === 1 ? '' : 's'}
      </Typography>
      {locations.length === 0 ? <Typography variant="body2" color="text.secondary">No office locations are available yet.</Typography> :
        <Stack spacing={1} className="office-location-list">
          {locations.map((location) => {
            const selected = selectedId === location.id
            return <Box key={location.id} sx={{
              border: '1px solid', borderColor: selected ? '#a4b993' : '#eeede6',
              borderRadius: 1, bgcolor: selected ? '#f2f5eb' : '#fffefa', p: 1.4
            }}>
              <Button fullWidth onClick={() => onSelect(location)} sx={{
                display: 'block', p: 0, minHeight: 0, textAlign: 'left', color: '#232921',
                '&:hover': { bgcolor: 'transparent' }
              }}>
                <Typography fontWeight={750} noWrap>{location.name}</Typography>
                <Typography display="block" variant="caption" color="text.secondary" sx={{ mt: .35 }}>
                  {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                </Typography>
              </Button>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">{location.resourceCount} resources</Typography>
                <Stack direction="row" spacing={.5}>
                  <Button size="small" onClick={() => onViewResources(location)} sx={{ minWidth: 0, px: 1, fontSize: 11 }}>Resources</Button>
                  <Button size="small" component="a" href={directionsUrl(location)} target="_blank" rel="noopener noreferrer"
                    startIcon={<UiIcon name="pin" size={13} />} sx={{ minWidth: 0, px: 1, fontSize: 11 }}>
                    Directions
                  </Button>
                </Stack>
              </Stack>
            </Box>
          })}
        </Stack>}
    </CardContent>
  </Card>
}
