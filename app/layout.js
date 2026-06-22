import './globals.css'
import { CartProvider } from '@/context/CartContext'

export const metadata = {
  title: 'Quán Nem – Đặt món online',
  description: 'Đặt nem chua, nem rán, nem nướng giao tận nhà',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
