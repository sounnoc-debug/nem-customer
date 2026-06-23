'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsConfirm(false)
    setResendMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        setNeedsConfirm(true)
        setError('Email của bạn chưa được xác nhận. Vui lòng kiểm tra hộp thư (kể cả mục Spam) và bấm vào link xác nhận trước khi đăng nhập.')
      } else {
        setError('Sai email hoặc mật khẩu.')
      }
      return
    }
    router.replace('/')
  }

  async function handleResend() {
    setResendMsg('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResendMsg(error ? 'Không gửi được, vui lòng thử lại sau vài phút.' : 'Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư.')
  }

  return (
    <div className="page">
      <img src="/logo.png" alt="Logo" style={{ height: 36, marginBottom: 8 }} />
      <p style={{ fontSize: 13, color: '#8A7158', marginBottom: 20 }}>Đăng nhập để đặt hàng và tích điểm</p>
      <form onSubmit={handleLogin}>
        <label style={{ fontSize: 13 }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: 12 }} />
        <label style={{ fontSize: 13 }}>Mật khẩu</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ marginBottom: 12 }} />
        {error && <p className="error-text">{error}</p>}
        {needsConfirm && (
          <div style={{ marginTop: 10 }}>
            <button type="button" className="btn secondary" onClick={handleResend}>Gửi lại email xác nhận</button>
            {resendMsg && <p style={{ fontSize: 13, color: 'var(--herb)', marginTop: 8 }}>{resendMsg}</p>}
          </div>
        )}
        <button className="btn" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      <p style={{ fontSize: 13, marginTop: 16, textAlign: 'center' }}>
        Chưa có tài khoản? <a href="/signup" style={{ textDecoration: 'underline' }}>Đăng ký ngay</a>
      </p>
    </div>
  )
}
