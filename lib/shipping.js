// ============================================================
// ★ VỊ TRÍ QUÁN — BẠN PHẢI ĐỔI ĐÚNG TỌA ĐỘ THẬT CỦA QUÁN MÌNH
// Cách lấy: mở Google Maps > chuột phải đúng vị trí quán > bấm vào
// dòng tọa độ hiện ra (dạng 10.xxxxx, 106.xxxxx) để copy.
// ============================================================
export const SHOP_LOCATION = {
  lat: 10.704328148144167,
  lng: 106.62104898464658,
  name: 'Quán Nem SOUN',
}

// Tính khoảng cách đường chim bay giữa 2 điểm (km)
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ============================================================
// ★ BIỂU PHÍ SHIP THEO KHOẢNG CÁCH — chỉnh số tiền tại đây nếu muốn
// (tham khảo từ file menu: 1km đầu ~5-7k, sau đó tính thêm theo km)
// ============================================================
export function calcShippingFee(distanceKm) {
  if (distanceKm <= 1) return 5000
  if (distanceKm <= 5) return 5000 + Math.ceil(distanceKm - 1) * 2000
  if (distanceKm <= 15) return 15000 + Math.ceil(distanceKm - 5) * 4000
  return 55000 + Math.ceil(distanceKm - 15) * 5000
}

// Định vị địa chỉ chữ thành tọa độ (dùng OpenStreetMap Nominatim - miễn phí)
export async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    address + ', Việt Nam'
  )}`
  const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } })
  const data = await res.json()
  if (!data || data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}
