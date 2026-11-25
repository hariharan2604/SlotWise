import { useEffect, useMemo } from 'react'
import { Box } from '@mui/material'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'

function CoordinateMapEvents({ onSelect }) {
  useMapEvents({
    click: ({ latlng }) => onSelect({
      latitude: latlng.lat.toFixed(6),
      longitude: latlng.lng.toFixed(6)
    })
  })

  return null
}

function MapViewport({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 13), { duration: .45 })
  }, [map, position])

  return null
}

export default function OfficeCoordinatePicker({ latitude, longitude, onSelect }) {
  const parsedLatitude = Number(latitude)
  const parsedLongitude = Number(longitude)
  const hasPosition = latitude.trim() !== '' && longitude.trim() !== '' &&
    Number.isFinite(parsedLatitude) && parsedLatitude >= -90 && parsedLatitude <= 90 &&
    Number.isFinite(parsedLongitude) && parsedLongitude >= -180 && parsedLongitude <= 180
  const position = useMemo(
    () => hasPosition ? [parsedLatitude, parsedLongitude] : null,
    [hasPosition, parsedLatitude, parsedLongitude]
  )

  return <Box className="office-coordinate-picker" role="region" aria-label="Map to choose office coordinates">
    <MapContainer center={position ?? [20, 0]} zoom={position ? 13 : 2} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapViewport position={position} />
      <CoordinateMapEvents onSelect={onSelect} />
      {position && <CircleMarker
        center={position}
        radius={9}
        pathOptions={{ color: '#24543f', fillColor: '#d6f278', fillOpacity: 1, weight: 3 }}
      />}
    </MapContainer>
  </Box>
}
