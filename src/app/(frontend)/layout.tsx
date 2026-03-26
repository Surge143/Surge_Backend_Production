import { redirect } from 'next/navigation'
import './globals.css'

export const metadata = {
  title: 'WhiteMantis - Premium Coffee',
  description: 'Discover premium coffee from around the world',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  // This triggers the redirect immediately on the server
  redirect('https://whitemantis-frontend-bfag.vercel.app/')

  // Note: The code below will not actually render because of the redirect above
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
