import type { Metadata } from 'next'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeManager } from '@/components/layout/ThemeManager'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--space-grotesk-font',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--inter-font',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--jetbrains-mono-font',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Zenith Ledger — Personal Expense Tracker',
  description: 'A minimalist personal expense tracker built with clarity and precision.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} font-body antialiased bg-surface text-on-surface`}
      >
        <ThemeManager />
        {children}
      </body>
    </html>
  )
}
