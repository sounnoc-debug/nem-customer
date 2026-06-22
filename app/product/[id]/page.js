'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)
  const cart = useCart()

  useEffect(() => { load() }, [id])

  async function load() {
    const { data: p } = await supabase.from('products').select('*').eq('id', id).single()
    const { data: r } = await supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(5)
    setProduct(p)
    setReviews(r || [])
  }

  if (!product) return <div className="page">Đang tải...</div>

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'

  function handleAdd() {
    cart.addItem(product, qty, note)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div>
      <div className="topbar-app">
        <a onClick={() => router.back()} style={{ fontSize: 18 }}>← Quay lại</a>
        <a href="/cart" style={{ fontSize: 20 }}>🛒</a>
      </div>

      <img src={product.image || 'https://placehold.co/480x320?text=Nem'} style={{ width: '100%', height: 220, objectFit: 'cover' }} />

      <div className="page">
        <h2 style={{ fontSize: 21, marginBottom: 6 }}>{product.name}</h2>
        <div style={{ fontSize: 18, color: 'var(--chili-dark)', fontWeight: 700, marginBottom: 12 }}>
          {product.sale_price ? <><s style={{ color: '#8A7158', fontSize: 14 }}>{fmt(product.price)}</s> {fmt(product.sale_price)}</> : fmt(product.price)}
        </div>
        <p style={{ fontSize: 14, color: '#5A4634', lineHeight: 1.5 }}>{product.description || 'Chưa có mô tả.'}</p>

        <div className="card" style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13 }}>Ghi chú cho quán (vd: ít cay, không hành...)</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Không bắt buộc" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <span style={{ fontSize: 14 }}>Số lượng</span>
            <div className="qty-control">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>
          </div>
        </div>

        <button className="btn" style={{ marginTop: 16 }} onClick={handleAdd}>
          {added ? '✓ Đã thêm vào giỏ' : `Thêm vào giỏ — ${fmt((product.sale_price || product.price) * qty)}`}
        </button>

        <h3 style={{ fontSize: 16, marginTop: 24, marginBottom: 10 }}>Đánh giá</h3>
        {reviews.length === 0 && <p style={{ color: '#8A7158', fontSize: 13 }}>Chưa có đánh giá nào.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="card" style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13 }}>{'⭐'.repeat(r.rating)}</div>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>{r.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
