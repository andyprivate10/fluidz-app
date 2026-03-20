import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { colors } from '../brand'

const S = colors

export type MapPin = {
  id: string
  lat: number
  lng: number
  label: string
  avatar?: string
  type: 'profile' | 'session'
  onClick?: () => void
}

type Props = {
  center: [number, number]
  zoom?: number
  pins: MapPin[]
  height?: number | string
  showUserLocation?: boolean
  userLat?: number
  userLng?: number
}

function createPinIcon(pin: MapPin): L.DivIcon {
  const color = pin.type === 'session' ? S.p : S.lav
  const letter = pin.label[0]?.toUpperCase() || '?'
  const avatarHtml = pin.avatar
    ? `<img src="${pin.avatar}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:2px solid ${color}"/>`
    : `<div style="width:30px;height:30px;border-radius:50%;background:${S.bg2};border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${color}">${letter}</div>`
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-15px,-38px)">
      ${avatarHtml}
      <div style="width:2px;height:6px;background:${color};margin-top:-1px"></div>
      <div style="width:6px;height:6px;border-radius:50%;background:${color};margin-top:-1px"></div>
    </div>`,
    iconSize: [30, 42],
  })
}

export default function MapView({ center, zoom = 14, pins, height = 280, showUserLocation, userLat, userLng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null }

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    })

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    // User location marker
    if (showUserLocation && userLat && userLng) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${S.blue};border:3px solid ${S.bg};box-shadow:0 0 8px ${S.blue}88;transform:translate(-7px,-7px)"></div>`,
        iconSize: [14, 14],
      })
      L.marker([userLat, userLng], { icon: userIcon }).addTo(map)
    }

    // Pins
    pins.forEach(pin => {
      const marker = L.marker([pin.lat, pin.lng], { icon: createPinIcon(pin) }).addTo(map)
      if (pin.onClick) marker.on('click', pin.onClick)
      marker.bindTooltip(pin.label, { direction: 'top', offset: [0, -40], className: 'fluidz-tooltip' })
    })

    // Fit bounds if multiple pins
    if (pins.length > 1) {
      const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng]))
      if (showUserLocation && userLat && userLng) bounds.extend([userLat, userLng])
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 })
    }

    leafletMap.current = map
    return () => { map.remove(); leafletMap.current = null }
  }, [center[0], center[1], zoom, pins.length, userLat, userLng])

  return (
    <>
      <style>{`
        .fluidz-tooltip { background: ${S.bg1} !important; color: ${S.tx} !important; border: 1px solid ${S.rule} !important; font-size: 11px !important; font-weight: 600 !important; border-radius: 8px !important; padding: 4px 8px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important; }
        .fluidz-tooltip::before { border-top-color: ${S.rule} !important; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height, borderRadius: 16, overflow: 'hidden', border: '1px solid ' + S.rule }} />
    </>
  )
}
