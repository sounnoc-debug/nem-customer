'use client'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import BottomNav from '@/components/BottomNav'

export default function CartPage() {
  const cart = useCart()
  const router = useRouter()
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'

  return (
    <div>
      <div className="topbar-app"><h1 style={{ fontSize: 19 }}>Giỏ hàng</h1></div>
      <div className="page">
        {cart.items.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60, color: '#8A7158' }}>
            <p style={{ fontSize: 40 }}>🛒</p>
            <p>Giỏ hàng đang trống.</p>
            <a href="/" className="btn" style={{ display: 'inline-block', marginTop: 12 }}>Xem món ngay</a>
          </div>
        )}

        {cart.items.map((i) => (
          <div key={i.product.id} className="cart-row">
            <img src={i.product.image || 'https://placehold.co/100x100?text=Nem'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{i.product.name}</div>
              <div style={{ fontSize: 13, color: 'var(--chili-dark)' }}>{fmt(i.product.sale_price || i.product.price)}</div>
              {i.note && <div style={{ fontSize: 11, color: '#8A7158' }}>Ghi chú: {i.note}</div>}
            </div>
            <div className="qty-control">
              <button onClick={() => cart.updateQuantity(i.product.id, i.quantity - 1)}>−</button>
              <span>{i.quantity}</span>
              <button onClick={() => cart.updateQuantity(i.product.id, i.quantity + 1)}>+</button>
            </div>
          </div>
        ))}

        {cart.items.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', fontSize: 16, fontWeight: 700 }}>
              <span>Tổng cộng</span>
              <span>{fmt(cart.total)}</span>
            </div>
            <button className="btn" onClick={() => router.push('/checkout')}>Đặt hàng ngay</button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
