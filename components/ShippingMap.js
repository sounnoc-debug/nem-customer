'use client'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function ShippingMap({ shop, customer }) {
  if (!customer) return null
  const center = [(shop.lat + customer.lat) / 2, (shop.lng + customer.lng) / 2]

  return (
    <div className="shipping-map" style={{ height: 200 }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <Marker position={[shop.lat, shop.lng]} icon={icon}><Popup>{shop.name || 'Quán Nem'}</Popup></Marker>
        <Marker position={[customer.lat, customer.lng]} icon={icon}><Popup>Địa chỉ của bạn</Popup></Marker>
        <Polyline positions={[[shop.lat, shop.lng], [customer.lat, customer.lng]]} color="#7A2331" weight={3} dashArray="6 6" />
      </MapContainer>
    </div>
  )
}
