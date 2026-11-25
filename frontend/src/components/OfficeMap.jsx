import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Box, Button, Stack, Typography } from '@mui/material'

const officeIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapViewport({ locations, selectedLocation }) {
  const map = useMap()

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([Number(selectedLocation.latitude), Number(selectedLocation.longitude)], Math.max(map.getZoom(), 13))
    } else if (locations.length > 1) {
      map.fitBounds(locations.map((location) => [Number(location.latitude), Number(location.longitude)]), { padding: [32, 32] })
    } else if (locations.length === 1) {
      map.setView([Number(locations[0].latitude), Number(locations[0].longitude)], 13)
    }
  }, [locations, map, selectedLocation])

  return null
}

export function OfficeLocationPopup({ location, onViewResources, onClose }) {
  const destination = `${location.latitude},${location.longitude}`
  return <Stack spacing={1} sx={{ minWidth: 190 }}>
    <Box>
      <Typography fontWeight={750}>{location.name}</Typography>
      <Typography variant="caption" color="text.secondary">
        {[location.address, location.city, location.state, location.country].filter(Boolean).join(', ')}
      </Typography>
      <Typography display="block" variant="caption" sx={{ mt: .5 }}>
        {location.resourceCount} active resource{location.resourceCount === 1 ? '' : 's'}
      </Typography>
    </Box>
    <Button size="small" variant="contained" onClick={() => { onViewResources(location); onClose?.() }}>
      View resources
    </Button>
    <Button size="small" component="a" href={`https://www.openstreetmap.org/directions?to=${encodeURIComponent(destination)}`}
      target="_blank" rel="noopener noreferrer">
      Get directions
    </Button>
  </Stack>
}

export function OfficeMapMarker({ location, selected, onSelect, onViewResources }) {
  return <Marker
    position={[Number(location.latitude), Number(location.longitude)]}
    icon={officeIcon}
    eventHandlers={{ click: () => onSelect(location) }}
    zIndexOffset={selected ? 1000 : 0}
  >
    <Popup>
      <OfficeLocationPopup location={location} onViewResources={onViewResources} />
    </Popup>
  </Marker>
}

export default function OfficeMap({ locations, selectedLocation, onSelect, onViewResources }) {
  const center = selectedLocation
    ? [Number(selectedLocation.latitude), Number(selectedLocation.longitude)]
    : locations.length
      ? [Number(locations[0].latitude), Number(locations[0].longitude)]
      : [20, 0]

  return <Box className="office-map">
    <MapContainer center={center} zoom={locations.length ? 5 : 2} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapViewport locations={locations} selectedLocation={selectedLocation} />
      {locations.map((location) => <OfficeMapMarker
        key={location.id}
        location={location}
        selected={location.id === selectedLocation?.id}
        onSelect={onSelect}
        onViewResources={onViewResources}
      />)}
    </MapContainer>
    <Typography className="office-map-attribution" variant="caption">
      Map data &copy; OpenStreetMap contributors
    </Typography>
  </Box>
}
