import './globals.css'
import Header from './components/Header'
import Footer from './components/Footer'
import { CartProvider } from './components/CartContext'

export const metadata = {
  title: 'WhiteMantis - Premium Coffee',
  description: 'Discover premium coffee from around the world',
}

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          <main style={{ minHeight: 'calc(100vh - 80px - 300px)' }}>
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}