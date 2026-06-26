'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [myVouchers, setMyVouchers] = useState([])
  const [birthday, setBirthday] = useState('')
  const [idFile, setIdFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const router = useRouter()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.auth.getUser()
    setAuthUser(data.user)
    if (data.user) {
      const { data: p } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      setProfile(p)
      setBirthday(p?.birthday || '')
      const { data: uv } = await supabase
        .from('user_vouchers')
        .select('*, vouchers(*)')
        .eq('user_id', data.user.id)
        .eq('used', false)
      setMyVouchers((uv || []).filter((v) => v.vouchers))
    }
  }

  function calcAge(b) {
    if (!b) return null
    const birth = new Date(b)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
    return age
  }

  async function handleSubmitVerification(e) {
    e.preventDefault()
    setSubmitError('')

    if (!birthday) { setSubmitError('Vui lòng nhập ngày sinh để xác nhận độ tuổi.'); return }
    const age = calcAge(birthday)
    if (age < 16) { setSubmitError('Combo Sinh viên yêu cầu khách từ 16 tuổi trở lên.'); return }
    if (!idFile) { setSubmitError('Vui lòng chọn ảnh thẻ sinh viên.'); return }

    setSubmitting(true)
    const filePath = `${authUser.id}/${Date.now()}_${idFile.name}`
    const { error: uploadErr } = await supabase.storage.from('student-ids').upload(filePath, idFile)
    if (uploadErr) {
      setSubmitError('Không tải được ảnh lên: ' + uploadErr.message)
      setSubmitting(false)
      return
    }

    const { error: updateErr } = await supabase
      .from('users')
      .update({ birthday, student_id_image: filePath, student_verification_status: 'pending', student_verification_note: null })
      .eq('id', authUser.id)

    setSubmitting(false)
    if (updateErr) { setSubmitError('Lỗi cập nhật hồ sơ: ' + updateErr.message); return }
    setIdFile(null)
    load()
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

        {/* ===== XÁC MINH SINH VIÊN ===== */}
        <div className="card" style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>🎓 Xác minh sinh viên</h3>
          <p style={{ fontSize: 12, color: '#8A7158', marginBottom: 12 }}>
            Cần xác minh độ tuổi + thẻ sinh viên để đặt được các phần trong nhóm "Combo Sinh viên".
          </p>

          {profile?.student_verification_status === 'approved' && (
            <div className="ticket-status status-done">✅ Đã xác minh — bạn có thể đặt Combo Sinh viên</div>
          )}

          {profile?.student_verification_status === 'pending' && (
            <div className="ticket-status status-pending">⏳ Đang chờ quán duyệt (thường trong 24h)</div>
          )}

          {(profile?.student_verification_status === 'none' || profile?.student_verification_status === 'rejected' || !profile?.student_verification_status) && (
            <>
              {profile?.student_verification_status === 'rejected' && (
                <p style={{ fontSize: 12, color: 'var(--chili)', marginBottom: 10 }}>
                  ❌ Yêu cầu trước đã bị từ chối{profile?.student_verification_note ? `: ${profile.student_verification_note}` : '.'} Vui lòng nộp lại.
                </p>
              )}
              <form onSubmit={handleSubmitVerification}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Ngày sinh (xác nhận độ tuổi)</label>
                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} required style={{ marginTop: 6, marginBottom: 12 }} />

                <label style={{ fontSize: 13, fontWeight: 600 }}>Ảnh thẻ sinh viên (mặt trước, rõ thông tin)</label>
                <input type="file" accept="image/*" onChange={(e) => setIdFile(e.target.files[0])} required style={{ marginTop: 6, marginBottom: 12 }} />

                {submitError && <p className="error-text">{submitError}</p>}
                <button className="btn" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu xác minh'}</button>
              </form>
            </>
          )}
        </div>

        <button className="btn secondary" style={{ marginTop: 16 }} onClick={handleLogout}>Đăng xuất</button>
      </div>
      <BottomNav />
    </div>
  )
}
