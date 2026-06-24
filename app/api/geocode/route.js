// ★ Route này chạy trên SERVER (Vercel), không phải trình duyệt khách —
// tránh bị OpenStreetMap chặn do chính sách không cho gọi trực tiếp từ browser.
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q) {
    return Response.json({ error: 'Thiếu địa chỉ cần tìm' }, { status: 400 })
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: {
        // ★ Nominatim BẮT BUỘC phải có User-Agent hợp lệ, nếu không sẽ bị từ chối
        'User-Agent': 'NemShopWebsite/1.0 (lien he qua website quan nem)',
        'Accept-Language': 'vi',
      },
    })

    if (!res.ok) {
      return Response.json({ error: `Dịch vụ bản đồ trả lỗi (mã ${res.status})` }, { status: 502 })
    }

    const data = await res.json()
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: 'Không kết nối được dịch vụ bản đồ: ' + e.message }, { status: 500 })
  }
}
