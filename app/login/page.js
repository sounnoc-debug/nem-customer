'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('Sai email hoặc mật khẩu.'); return }
    router.replace('/')
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>🌿 Đăng nhập</h1>
      <p style={{ fontSize: 13, color: '#8A7158', marginBottom: 20 }}>Đăng nhập để đặt hàng và tích điểm</p>
      <form onSubmit={handleLogin}>
        <label style={{ fontSize: 13 }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: 12 }} />
        <label style={{ fontSize: 13 }}>Mật khẩu</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ marginBottom: 12 }} />
        {error && <p className="error-text">{error}</p>}
        <button className="btn" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      <p style={{ fontSize: 13, marginTop: 16, textAlign: 'center' }}>
        Chưa có tài khoản? <a href="/signup" style={{ textDecoration: 'underline' }}>Đăng ký ngay</a>
      </p>
    </div>
  )
}
