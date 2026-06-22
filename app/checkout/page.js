'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/context/CartContext'

export default function CheckoutPage() {
  const cart = useCart()
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState('cod')
  const [voucherCode, setVoucherCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
  const shippingFee = cart.total >= 100000 ? 0 : 15000
  const finalTotal = cart.total + shippingFee - discount

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function applyVoucher() {
    if (!voucherCode) return
    const { data } = await supabase.from('vouchers').select('*').eq('code', voucherCode.toUpperCase()).single()
    if (!data) {
      setError('Mã giảm giá không hợp lệ.')
      setDiscount(0)
      return
    }
    setError('')
    const value = data.discount_type === 'percent' ? (cart.total * data.discount_value) / 100 : data.discount_value
    setDiscount(value)
  }

  async function handleSubmit() {
    if (!address || !phone) {
      setError('Vui lòng nhập đầy đủ địa chỉ và số điện thoại.')
      return
    }
    if (!user) {
      setError('Bạn cần đăng nhập trước khi đặt hàng.')
      return
    }
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
    await supabase.from('order_items').insert(orderItems)

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
          <label style={{ fontSize: 13 }}>Số điện thoại</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" />
          <label style={{ fontSize: 13, marginTop: 10, display: 'block' }}>Địa chỉ giao hàng</label>
          <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, đường, quận..." />
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13 }}>Mã giảm giá</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="NEM10" />
            <button className="btn secondary" style={{ width: 'auto', padding: '0 16px' }} onClick={applyVoucher}>Áp dụng</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>Phương thức thanh toán</label>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}><span>Phí giao hàng</span><span>{shippingFee === 0 ? 'Miễn phí' : fmt(shippingFee)}</span></div>
          {discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: 'var(--herb)' }}><span>Giảm giá</span><span>−{fmt(discount)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, marginTop: 8 }}><span>Tổng cộng</span><span>{fmt(finalTotal)}</span></div>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="btn" style={{ marginTop: 16 }} disabled={loading} onClick={handleSubmit}>
          {loading ? 'Đang đặt hàng...' : 'Xác nhận đặt hàng'}
        </button>
      </div>
    </div>
  )
}
