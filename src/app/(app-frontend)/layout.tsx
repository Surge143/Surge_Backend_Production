import type { Metadata } from 'next'
import '../(frontend)/globals.css'
import AppShell from './_components/AppShell'

export const metadata: Metadata = {
    title: 'White Mantis App',
    description: 'Order from your favourite White Mantis cafe.',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AppShell>{children}</AppShell>
            </body>
        </html>
    )
}