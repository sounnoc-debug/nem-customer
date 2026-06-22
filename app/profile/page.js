'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const router = useRouter()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.auth.getUser()
    setAuthUser(data.user)
    if (data.user) {
      const { data: p } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      setProfile(p)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (!authUser) {
    return (
      <div className="page" style={{ textAlign: 'center', marginTop: 60 }}>
        <p style={{ fontSize: 40 }}>👤</p>
        <p style={{ color: '#8A7158', marginBottom: 16 }}>Bạn chưa đăng nhập.</p>
        <a href="/login" className="btn" style={{ display: 'inline-block' }}>Đăng nhập</a>
        <BottomNav />
      </div>
    )
  }

  return (
    <div>
      <div className="topbar-app"><h1 style={{ fontSize: 19 }}>Tài khoản</h1></div>
      <div className="page">
        <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36 }}>🙂</div>
          <h2 style={{ fontSize: 18, marginTop: 8 }}>{profile?.full_name || authUser.email}</h2>
          <p style={{ fontSize: 13, color: '#8A7158' }}>{authUser.email}</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--chili-dark)' }}>{profile?.points ?? 0}</div>
            <div style={{ fontSize: 12, color: '#8A7158' }}>Điểm thưởng</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{profile?.level || 'Thành viên'}</div>
            <div style={{ fontSize: 12, color: '#8A7158' }}>Hạng</div>
          </div>
        </div>

        <a href="/orders" className="card" style={{ display: 'block', marginBottom: 10 }}>🧾 Lịch sử đơn hàng</a>
        <a href="#" className="card" style={{ display: 'block', marginBottom: 10 }}>❤️ Món yêu thích</a>

        <button className="btn secondary" style={{ marginTop: 16 }} onClick={handleLogout}>Đăng xuất</button>
      </div>
      <BottomNav />
    </div>
  )
}
