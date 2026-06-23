'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BottomNav from '@/components/BottomNav'

// Thứ tự hợp lý cho nhóm Combo: Sinh viên -> Gia đình -> Theo đoàn
const COMBO_ORDER = ['Combo Sinh viên', 'Combo Gia đình', 'Combo Theo đoàn']

function classify(categoryName) {
  if (!categoryName) return 'main'
  if (categoryName.startsWith('Combo')) return 'combo'
  if (categoryName === 'Đồ ăn thêm') return 'addon'
  if (categoryName === 'Nước uống') return 'drink'
  return 'main'
}

export default function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [activeCat, setActiveCat] = useState('all') // 'all' | 'combo' | category.id

  useEffect(() => { load() }, [])

  async function load() {
    const { data: c } = await supabase.from('categories').select('*')
    const { data: p } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setCategories(c || [])
    setProducts(p || [])
  }

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
  const catById = (id) => categories.find((c) => c.id === id)

  const mainCats = categories.filter((c) => classify(c.name) === 'main')
  const drinkCat = categories.find((c) => classify(c.name) === 'drink')
  const addonCat = categories.find((c) => classify(c.name) === 'addon')
  const hasCombo = categories.some((c) => classify(c.name) === 'combo')

  function productsOfGroup(group) {
    return products.filter((p) => classify(catById(p.category_id)?.name) === group)
  }

  function comboProductsSorted() {
    const comboCats = categories.filter((c) => classify(c.name) === 'combo')
    const orderIndex = (name) => {
      const idx = COMBO_ORDER.findIndex((o) => name === o)
      return idx === -1 ? 999 : idx
    }
    const sortedCats = [...comboCats].sort((a, b) => orderIndex(a.name) - orderIndex(b.name))
    return sortedCats.map((cat) => ({
      cat,
      items: products.filter((p) => p.category_id === cat.id).sort((a, b) => a.price - b.price),
    }))
  }

  function ProductCard({ p }) {
    return (
      <a href={`/product/${p.id}`} className="product-card">
        <img className="img" src={p.image || 'https://placehold.co/300x220?text=Nem'} alt={p.name} />
        <div className="info">
          <div className="name">{p.name} {p.is_hot && <span className="badge-hot">HOT</span>}</div>
          <div className="price">{p.sale_price ? <><s>{fmt(p.price)}</s>{fmt(p.sale_price)}</> : fmt(p.price)}</div>
        </div>
      </a>
    )
  }

  function SectionHeader({ cat, title }) {
    return (
      <div style={{ margin: '18px 16px 10px' }}>
        {cat?.image && (
          <img src={cat.image} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 12, marginBottom: 8 }} />
        )}
        <h3 style={{ fontSize: 16 }}>{cat?.icon || ''} {title}</h3>
      </div>
    )
  }

  return (
    <>
      <div className="topbar-app">
        <h1 style={{ fontSize: 19 }}>🌿 Quán Nem</h1>
        <a href="/cart" style={{ fontSize: 20 }}>🛒</a>
      </div>

      <div className="category-pills">
        <div className={`pill ${activeCat === 'all' ? 'active' : ''}`} onClick={() => setActiveCat('all')}>Tất cả</div>
        {mainCats.map((c) => (
          <div key={c.id} className={`pill ${activeCat === c.id ? 'active' : ''}`} onClick={() => setActiveCat(c.id)}>
            {c.icon} {c.name}
          </div>
        ))}
        {drinkCat && (
          <div className={`pill ${activeCat === drinkCat.id ? 'active' : ''}`} onClick={() => setActiveCat(drinkCat.id)}>
            {drinkCat.icon} {drinkCat.name}
          </div>
        )}
        {addonCat && (
          <div className={`pill ${activeCat === addonCat.id ? 'active' : ''}`} onClick={() => setActiveCat(addonCat.id)}>
            {addonCat.icon} {addonCat.name}
          </div>
        )}
        {hasCombo && (
          <div className={`pill ${activeCat === 'combo' ? 'active' : ''}`} onClick={() => setActiveCat('combo')}>
            🎉 Combo
          </div>
        )}
      </div>

      {activeCat === 'all' && (
        <>
          {comboProductsSorted().map(({ cat, items }) => items.length > 0 && (
            <div key={cat.id}>
              <SectionHeader cat={cat} title={cat.name} />
              <div className="product-grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            </div>
          ))}

          {mainCats.map((cat) => {
            const items = products.filter((p) => p.category_id === cat.id)
            if (items.length === 0) return null
            return (
              <div key={cat.id}>
                <SectionHeader cat={cat} title={cat.name} />
                <div className="product-grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
              </div>
            )
          })}

          {addonCat && productsOfGroup('addon').length > 0 && (
            <div>
              <SectionHeader cat={addonCat} title="Đồ ăn thêm" />
              <div className="product-grid">{productsOfGroup('addon').map((p) => <ProductCard key={p.id} p={p} />)}</div>
            </div>
          )}

          {drinkCat && productsOfGroup('drink').length > 0 && (
            <div>
              <SectionHeader cat={drinkCat} title="Nước uống" />
              <div className="product-grid">{productsOfGroup('drink').map((p) => <ProductCard key={p.id} p={p} />)}</div>
            </div>
          )}
        </>
      )}

      {activeCat === 'combo' && (
        <>
          {comboProductsSorted().map(({ cat, items }) => items.length > 0 && (
            <div key={cat.id}>
              <SectionHeader cat={cat} title={cat.name} />
              <div className="product-grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            </div>
          ))}
        </>
      )}

      {activeCat !== 'all' && activeCat !== 'combo' && (
        <div className="product-grid">
          {products.filter((p) => p.category_id === activeCat).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}

      <BottomNav />
    </>
  )
}
