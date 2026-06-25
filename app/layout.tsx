'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LangProvider, useLang } from '@/lib/lang-context'

function Header() {
  const { lang, setLang } = useLang()
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  if (isAdmin) return null

  const tabs = [
    { href: '/',         th: 'กติกา',       en: 'Rules'    },
    { href: '/queue',    th: 'คิว',          en: 'Queue'    },
    { href: '/register', th: 'ลงทะเบียน',   en: 'Register' },
  ]

  return (
    <header style={{ backgroundColor: 'white', borderBottom: '1.5px solid #f3c6d0', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="max-w-2xl mx-auto px-4">
        {/* Top row */}
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>
              B
            </div>
            <span className="font-bold text-base leading-tight" style={{ color: 'var(--bonnie-dark)', fontFamily: 'Georgia, serif' }}>
              Bonnie <span className="font-normal text-sm" style={{ color: 'var(--bonnie-muted)' }}>Food Support</span>
            </span>
          </Link>

          {/* Lang toggle */}
          <div className="flex rounded-full overflow-hidden border" style={{ borderColor: '#f3c6d0' }}>
            {(['th', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className="px-3 py-1 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: lang === l ? 'var(--bonnie-rose)' : 'white',
                  color: lang === l ? 'white' : 'var(--bonnie-muted)',
                }}>
                {l === 'th' ? 'ไทย' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab row */}
        <div className="flex border-t" style={{ borderColor: '#f9dde5' }}>
          {tabs.map(tab => {
            const active = pathname === tab.href
            return (
              <Link key={tab.href} href={tab.href}
                className="flex-1 text-center py-2.5 text-sm font-medium transition-colors relative"
                style={{ color: active ? 'var(--bonnie-rose)' : 'var(--bonnie-muted)' }}>
                {lang === 'th' ? tab.th : tab.en}
                {active && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--bonnie-rose)' }} />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  return (
    <main className={isAdmin ? '' : 'max-w-2xl mx-auto px-4 py-6'}>
      {children}
    </main>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen" style={{ backgroundColor: 'var(--bonnie-cream)' }}>
        <LangProvider>
          <Header />
          <Body>{children}</Body>
          <footer className="text-center py-8 text-xs" style={{ color: 'var(--bonnie-muted)' }}>
            © Bonnie Food Support — with love 🌸 · <a href="/admin/login" style={{ color: "var(--bonnie-muted)", textDecoration: "none" }}>Admin</a>
          </footer>
        </LangProvider>
      </body>
    </html>
  )
}
