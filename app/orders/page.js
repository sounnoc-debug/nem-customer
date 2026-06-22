'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BottomNav from '@/components/BottomNav'

const STEPS = [
  { key: 'pending', label: 'Xác nhận' },
  { key: 'cooking', label: 'Đang làm' },
  { key: 'delivering', label: 'Đang giao' },
  { key: 'done', label: 'Hoàn tất' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { setLoading(false); return }
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name))')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
  const stepIndex = (status) => STEPS.findIndex((s) => s.key === status)

  return (
    <div>
      <div className="topbar-app"><h1 style={{ fontSize: 19 }}>Đơn hàng của tôi</h1></div>
      <div className="page">
        {loading && <p>Đang tải...</p>}
        {!loading && orders.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60, color: '#8A7158' }}>
            <p style={{ fontSize: 40 }}>🧾</p>
            <p>Bạn chưa có đơn hàng nào. Hãy đăng nhập nếu bạn vừa đặt hàng.</p>
          </div>
        )}

        {orders.map((o) => (
          <div key={o.id} className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>#{o.id.slice(0, 8)}</strong>
              <span style={{ fontSize: 12, color: '#8A7158' }}>{new Date(o.created_at).toLocaleString('vi-VN')}</span>
            </div>

            {o.status !== 'cancelled' ? (
              <div className="order-tracker">
                {STEPS.map((s, idx) => (
                  <div key={s.key} className={`step ${idx <= stepIndex(o.status) ? 'done' : ''}`}>
                    <div className="dot" />
                    {s.label}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--chili)', fontSize: 13 }}>Đơn hàng đã bị hủy.</p>
            )}

            <div style={{ fontSize: 13, color: '#5A4634', marginBottom: 6 }}>
              {o.order_items?.map((it) => it.products?.name).filter(Boolean).join(', ')}
            </div>
            <div style={{ fontWeight: 700 }}>{fmt(o.total_amount)}</div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
