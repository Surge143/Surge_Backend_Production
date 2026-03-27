import { redirect } from 'next/navigation'

export default function RootPage() {
  // This will fire as soon as someone hits localhost:3000/
  redirect('https://whitemantis-frontend-bfag.vercel.app/')

  return null
}