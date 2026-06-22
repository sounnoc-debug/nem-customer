'use client'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'

const TABS = [
  { href: '/', icon: '🏠', label: 'Trang chủ' },
  { href: '/cart', icon: '🛒', label: 'Giỏ hàng' },
  { href: '/orders', icon: '🧾', label: 'Đơn hàng' },
  { href: '/profile', icon: '👤', label: 'Tài khoản' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const cart = useCart()
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <a key={t.href} href={t.href} className={pathname === t.href ? 'active' : ''}>
          <span className="icon">{t.icon}</span>
          {t.label}
          {t.href === '/cart' && cart?.count > 0 && (
            <span style={{ marginLeft: 4, background: 'var(--chili)', color: 'white', borderRadius: 8, fontSize: 10, padding: '1px 5px' }}>
              {cart.count}
            </span>
          )}
        </a>
      ))}
    </nav>
  )
}
