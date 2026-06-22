'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useCart } from '@/context/CartContext'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [activeCat, setActiveCat] = useState('all')
  const cart = useCart()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: c } = await supabase.from('categories').select('*')
    const { data: p } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setCategories(c || [])
    setProducts(p || [])
  }

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
  const visible = activeCat === 'all' ? products : products.filter((p) => p.category_id === activeCat)

  return (
    <>
      <div className="topbar-app">
        <h1 style={{ fontSize: 19 }}>🌿 Quán Nem</h1>
        <a href="/cart" style={{ fontSize: 20 }}>🛒</a>
      </div>

      <div className="category-pills">
        <div className={`pill ${activeCat === 'all' ? 'active' : ''}`} onClick={() => setActiveCat('all')}>Tất cả</div>
        {categories.map((c) => (
          <div key={c.id} className={`pill ${activeCat === c.id ? 'active' : ''}`} onClick={() => setActiveCat(c.id)}>
            {c.icon} {c.name}
          </div>
        ))}
      </div>

      <div className="product-grid">
        {visible.length === 0 && (
          <p style={{ color: '#8A7158', padding: '0 4px' }}>Chưa có món nào trong danh mục này.</p>
        )}
        {visible.map((p) => (
          <a key={p.id} href={`/product/${p.id}`} className="product-card">
            <img className="img" src={p.image || 'https://placehold.co/300x220?text=Nem'} alt={p.name} />
            <div className="info">
              <div className="name">{p.name} {p.is_hot && <span className="badge-hot">HOT</span>}</div>
              <div className="price">
                {p.sale_price ? <><s>{fmt(p.price)}</s>{fmt(p.sale_price)}</> : fmt(p.price)}
              </div>
            </div>
          </a>
        ))}
      </div>

      <BottomNav />
    </>
  )
}
