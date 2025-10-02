import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AMAWA - Sistema de Gestión',
  description: 'Sistema de Automatización de Servicios de Purificación de Agua',
  icons: {
    icon: '/images/amawa_logo.png',
    apple: '/images/amawa_logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}