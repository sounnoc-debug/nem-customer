'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/context/CartContext'
import { SHOP_LOCATION, haversineDistanceKm, calcShippingFee } from '@/lib/shipping'

const ShippingMap = dynamic(() => import('@/components/ShippingMap'), { ssr: false })

const FREE_SHIP_THRESHOLD = 150000 // ★ đơn từ giá này được miễn phí ship, đổi tại đây nếu muốn

export default function CheckoutPage() {
  const cart = useCart()
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState('cod')
  const [voucherCode, setVoucherCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [appliedUserVoucherId, setAppliedUserVoucherId] = useState(null) // ★ chỉ có giá trị nếu voucher là cá nhân, cần đánh dấu đã dùng
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  const [customerLocation, setCustomerLocation] = useState(null)
  const [distanceKm, setDistanceKm] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'

  const isFreeShip = cart.total >= FREE_SHIP_THRESHOLD
  const distanceFee = distanceKm != null ? calcShippingFee(distanceKm) : 15000 // chưa định vị -> phí tạm tính
  const shippingFee = isFreeShip ? 0 : distanceFee
  const finalTotal = cart.total + shippingFee - discount

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleLocate() {
    if (!address) { setGeoError('Vui lòng nhập địa chỉ trước.'); return }
    setGeoLoading(true)
    setGeoError('')
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(address + ', Việt Nam')}`)
      const data = await res.json()
      setGeoLoading(false)

      if (!res.ok || data.error) {
        setGeoError(`Lỗi định vị: ${data.error || 'không xác định'}. Bạn vẫn có thể đặt hàng, quán sẽ tính phí ship tay.`)
        setCustomerLocation(null)
        setDistanceKm(null)
        return
      }
      if (!data || data.length === 0) {
        setGeoError('Không tìm thấy địa chỉ này trên bản đồ. Hãy thử ghi rõ hơn (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành — viết liền không viết tắt).')
        setCustomerLocation(null)
        setDistanceKm(null)
        return
      }
      const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      setCustomerLocation(loc)
      const km = haversineDistanceKm(SHOP_LOCATION.lat, SHOP_LOCATION.lng, loc.lat, loc.lng)
      setDistanceKm(km)
    } catch (e) {
      setGeoLoading(false)
      setGeoError('Không kết nối được dịch vụ bản đồ: ' + e.message)
      setCustomerLocation(null)
      setDistanceKm(null)
    }
  }

  async function applyVoucher() {
    if (!voucherCode) return
    setError('')
    setAppliedUserVoucherId(null)

    const { data: voucher } = await supabase.from('vouchers').select('*').eq('code', voucherCode.toUpperCase()).single()
    if (!voucher) { setError('Mã giảm giá không hợp lệ.'); setDiscount(0); return }

    // Kiểm tra ngày hết hạn
    if (voucher.expired_at && new Date(voucher.expired_at) < new Date()) {
      setError('Mã giảm giá này đã hết hạn.')
      setDiscount(0)
      return
    }

    // ★ Voucher cá nhân (do Nem Passport tự tặng) — chỉ đúng người được tặng mới dùng được.
    // Nhờ Row Level Security, nếu voucher này thuộc về người KHÁC, truy vấn dưới đây sẽ
    // không trả về kết quả nào (bị ẩn), nên không thể đoán mã của người khác để dùng trộm.
    if (voucher.is_personal) {
      if (!user) { setError('Bạn cần đăng nhập để dùng voucher cá nhân này.'); setDiscount(0); return }
      const { data: uv } = await supabase
        .from('user_vouchers')
        .select('*')
        .eq('voucher_id', voucher.id)
        .eq('used', false)
        .maybeSingle()

      if (!uv) {
        setError('Mã này là quà riêng tặng cho 1 khách hàng cụ thể và không thuộc về tài khoản của bạn, hoặc đã được dùng rồi.')
        setDiscount(0)
        return
      }
      setAppliedUserVoucherId(uv.id)
    }

    const value = voucher.discount_type === 'percent' ? (cart.total * voucher.discount_value) / 100 : voucher.discount_value
    setDiscount(value)
  }

  async function handleSubmit() {
    if (!address || !phone) { setError('Vui lòng nhập đầy đủ địa chỉ và số điện thoại.'); return }
    if (!user) { setError('Bạn cần đăng nhập trước khi đặt hàng.'); return }
    setLoading(true)

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: finalTotal,
        shipping_fee: shippingFee,
        discount_amount: discount,
        payment_method: payment,
        status: 'pending',
        address,
        phone,
      })
      .select()
      .single()

    if (orderErr) {
      setError('Có lỗi khi tạo đơn hàng: ' + orderErr.message)
      setLoading(false)
      return
    }

    const orderItems = cart.items.map((i) => ({
      order_id: order.id,
      product_id: i.product.id,
      quantity: i.quantity,
      price: i.product.sale_price || i.product.price,
    }))
    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)

    if (itemsErr) {
      // Đơn đã tạo nhưng món bị chặn -> xóa đơn rác để khách thử lại
      await supabase.from('orders').delete().eq('id', order.id)
      setLoading(false)
      if (itemsErr.message?.includes('STUDENT_VERIFICATION_REQUIRED')) {
        setError('Giỏ hàng của bạn có món "Combo Sinh viên" nhưng tài khoản chưa được xác minh sinh viên. Vui lòng xác minh ở mục Tài khoản trước, hoặc bỏ món này khỏi giỏ.')
      } else {
        setError('Có lỗi khi tạo đơn hàng: ' + itemsErr.message)
      }
      return
    }

    // ★ Nếu đơn này dùng voucher cá nhân (Nem Passport), đánh dấu đã dùng để không dùng lại được
    if (appliedUserVoucherId) {
      await supabase.from('user_vouchers').update({ used: true }).eq('id', appliedUserVoucherId)
    }

    cart.clearCart()
    setLoading(false)
    router.push('/orders')
  }

  return (
    <div>
      <div className="topbar-app"><h1 style={{ fontSize: 19 }}>Thanh toán</h1></div>
      <div className="page">
        {!user && (
          <div className="card" style={{ marginBottom: 16, background: '#FDE3D8' }}>
            Bạn cần <a href="/login" style={{ textDecoration: 'underline' }}>đăng nhập</a> trước khi đặt hàng.
          </div>
        )}

        <div className="card" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Số điện thoại</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" style={{ marginTop: 6 }} />

          <label style={{ fontSize: 13, fontWeight: 600, marginTop: 12, display: 'block' }}>Địa chỉ giao hàng</label>
          <textarea
            rows={2} value={address}
            onChange={(e) => { setAddress(e.target.value); setCustomerLocation(null); setDistanceKm(null) }}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            style={{ marginTop: 6 }}
          />

          <button type="button" className="btn secondary" style={{ marginTop: 10 }} onClick={handleLocate} disabled={geoLoading}>
            📍 {geoLoading ? 'Đang định vị...' : 'Định vị địa chỉ & tính phí ship'}
          </button>
          {geoError && <p className="error-text">{geoError}</p>}

          {customerLocation && (
            <>
              <ShippingMap shop={SHOP_LOCATION} customer={customerLocation} />
              <div className="distance-pill">🚴 ~{distanceKm.toFixed(1)} km từ quán — phí ship {fmt(calcShippingFee(distanceKm))}</div>
            </>
          )}
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Mã giảm giá</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input value={voucherCode} onChange={(e) => { setVoucherCode(e.target.value); setDiscount(0); setAppliedUserVoucherId(null) }} placeholder="NEM10" />
            <button className="btn secondary" style={{ width: 'auto', padding: '0 16px' }} onClick={applyVoucher}>Áp dụng</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>Phương thức thanh toán</label>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
            <input type="radio" checked={payment === 'cod'} onChange={() => setPayment('cod')} style={{ width: 'auto', marginRight: 8 }} />
            Thanh toán khi nhận hàng (COD)
          </label>
          <label style={{ display: 'block', fontSize: 14 }}>
            <input type="radio" checked={payment === 'bank'} onChange={() => setPayment('bank')} style={{ width: 'auto', marginRight: 8 }} />
            Chuyển khoản
          </label>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}><span>Tạm tính</span><span>{fmt(cart.total)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
            <span>Phí giao hàng {!isFreeShip && distanceKm == null && '(tạm tính)'}</span>
            <span>{isFreeShip ? 'Miễn phí' : fmt(shippingFee)}</span>
          </div>
          {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: 'var(--herb)' }}><span>Giảm giá</span><span>−{fmt(discount)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, marginTop: 8 }}><span>Tổng cộng</span><span>{fmt(finalTotal)}</span></div>
          {!isFreeShip && distanceKm == null && (
            <p style={{ fontSize: 11, color: '#8A7158', marginTop: 8 }}>★ Bấm "Định vị địa chỉ" ở trên để tính phí ship chính xác theo khoảng cách thật.</p>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="btn" style={{ marginTop: 16 }} disabled={loading} onClick={handleSubmit}>
          {loading ? 'Đang đặt hàng...' : 'Xác nhận đặt hàng'}
        </button>
      </div>
    </div>
  )
}
