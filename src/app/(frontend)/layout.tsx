import './globals.css'

export const metadata = {
  title: 'WhiteMantis - Premium Coffee',
  description: 'Discover premium coffee from around the world',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
