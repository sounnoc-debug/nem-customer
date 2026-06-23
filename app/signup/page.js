'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="page" style={{ textAlign: 'center', marginTop: 60 }}>
        <p style={{ fontSize: 40 }}>📩</p>
        <h2 style={{ fontSize: 18 }}>Kiểm tra email của bạn!</h2>
        <p style={{ fontSize: 13, color: '#8A7158', lineHeight: 1.6 }}>
          Chúng tôi đã gửi 1 email xác nhận đến <strong>{email}</strong>.<br />
          Bạn cần bấm vào link trong email đó trước khi đăng nhập được.
          Nếu không thấy, hãy kiểm tra thêm mục Spam/Quảng cáo.
        </p>
        <a href="/login" className="btn" style={{ display: 'inline-block', marginTop: 16 }}>Tôi đã xác nhận, đăng nhập ngay</a>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>🌿 Tạo tài khoản</h1>
      <p style={{ fontSize: 13, color: '#8A7158', marginBottom: 20 }}>Tham gia để nhận voucher và tích điểm</p>
      <form onSubmit={handleSignup}>
        <label style={{ fontSize: 13 }}>Họ và tên</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ marginBottom: 12 }} />
        <label style={{ fontSize: 13 }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: 12 }} />
        <label style={{ fontSize: 13 }}>Mật khẩu (ít nhất 6 ký tự)</label>
        <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ marginBottom: 12 }} />
        {error && <p className="error-text">{error}</p>}
        <button className="btn" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Đang tạo...' : 'Đăng ký'}</button>
      </form>
      <p style={{ fontSize: 13, marginTop: 16, textAlign: 'center' }}>
        Đã có tài khoản? <a href="/login" style={{ textDecoration: 'underline' }}>Đăng nhập</a>
      </p>
    </div>
  )
}
