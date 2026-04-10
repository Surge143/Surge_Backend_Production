import './globals.css'
import { Outfit } from 'next/font/google'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Providers } from './components/Providers'
import { CartProvider } from './context/CartContext'
import { UserProvider } from './context/UserContext'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata = {
  title: 'Surge | Premium Specialty Coffee',
  description: 'Experience the ultimate specialty coffee through our store and cafe app.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="premium-gradient">
        <Providers>
          <UserProvider>
            <CartProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </CartProvider>
          </UserProvider>
        </Providers>
      </body>
    </html>
  )
}
