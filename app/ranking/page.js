'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const router = useRouter()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.rpc('get_leaderboard', { limit_n: 10 })
    setList(data || [])
    setLoading(false)
  }

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'

  return (
    <div>
      <div className="topbar-app">
        <a onClick={() => router.back()} style={{ fontSize: 18 }}>← Quay lại</a>
        <h1 style={{ fontSize: 19 }}>🏆 Bảng xếp hạng</h1>
      </div>
      <div className="page">
        <p style={{ fontSize: 12, color: '#8A7158', marginBottom: 16, textAlign: 'center' }}>
          Top 10 khách hàng chi tiêu nhiều nhất (tính theo đơn đã hoàn tất)
        </p>

        {loading && <p>Đang tải...</p>}
        {!loading && list.length === 0 && <p style={{ color: '#8A7158', textAlign: 'center' }}>Chưa có dữ liệu.</p>}

        {list.map((u, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{RANK_MEDALS[i] || `#${i + 1}`}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{u.full_name}</div>
              <div style={{ fontSize: 12, color: '#8A7158' }}>{u.level}</div>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--chili-dark)', fontSize: 13 }}>{fmt(u.total_spend)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
