'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [myVouchers, setMyVouchers] = useState([])
  const router = useRouter()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.auth.getUser()
    setAuthUser(data.user)
    if (data.user) {
      const { data: p } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      setProfile(p)
      const { data: uv } = await supabase
        .from('user_vouchers')
        .select('*, vouchers(*)')
        .eq('user_id', data.user.id)
        .eq('used', false)
      setMyVouchers((uv || []).filter((v) => v.vouchers))
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

        {/* ===== NEM PASSPORT ===== */}
        <div className="card" style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>📘 Nem Passport</h3>
          <p style={{ fontSize: 12, color: '#8A7158', marginBottom: 12 }}>
            Mỗi đơn hoàn tất = 1 con dấu. Đủ 10 dấu tự động nhận voucher 30.000đ!
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const filled = i < (profile?.passport_stamps ?? 0)
              return (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, border: `2px dashed ${filled ? 'var(--chili)' : 'var(--line)'}`,
                  background: filled ? '#FDE3D8' : 'transparent',
                }}>
                  {filled ? '🥟' : ''}
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 12, color: '#8A7158', marginTop: 10 }}>
            {profile?.passport_stamps ?? 0}/10 dấu — đã hoàn tất {profile?.passport_total_completed ?? 0} đơn từ trước đến nay
          </p>
        </div>

        {myVouchers.length > 0 && (
          <div className="card" style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>🎁 Quà của bạn</h3>
            {myVouchers.map((uv) => (
              <div key={uv.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <strong>{uv.vouchers.code}</strong> —{' '}
                {uv.vouchers.discount_type === 'percent' ? `Giảm ${uv.vouchers.discount_value}%` : `Giảm ${Number(uv.vouchers.discount_value).toLocaleString('vi-VN')}đ`}
                <div style={{ fontSize: 11, color: '#8A7158' }}>
                  Dùng mã này ở bước thanh toán, trước {uv.vouchers.expired_at ? new Date(uv.vouchers.expired_at).toLocaleDateString('vi-VN') : 'khi hết hạn'}
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn secondary" style={{ marginTop: 16 }} onClick={handleLogout}>Đăng xuất</button>
      </div>
      <BottomNav />
    </div>
  )
}
