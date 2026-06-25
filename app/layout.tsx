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
    { href: '/',         th: 'กติกา',     en: 'Rules'    },
    { href: '/queue',    th: 'คิว',        en: 'Queue'    },
    { href: '/register', th: 'ลงทะเบียน', en: 'Register' },
  ]

  return (
    <header style={{ backgroundColor: 'white', borderBottom: '1.5px solid #f3c6d0', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="max-w-2xl mx-auto px-4">
        {/* Top row */}
        <div className="flex items-center justify-between py-3 gap-2">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>
              B
            </div>
            <span className="font-bold text-base leading-tight" style={{ color: 'var(--bonnie-dark)', fontFamily: 'Georgia, serif' }}>
              Bonnie <span className="font-normal text-sm" style={{ color: 'var(--bonnie-muted)' }}>Food Support</span>
            </span>
          </Link>

          {/* Right side: social + lang */}
          <div className="flex items-center gap-2">
            {/* Social links */}
            <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: 'var(--bonnie-muted)' }}>
              <a href="https://x.com/bonnieofficialth_" target="_blank" rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                @bonnieofficialth_
              </a>
              <span style={{ color: '#f3c6d0' }}>|</span>
              <a href="https://instagram.com/bonnieofficialth" target="_blank" rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                bonnieofficialth
              </a>
            </div>

            {/* Lang toggle */}
            <div className="flex rounded-full overflow-hidden border flex-shrink-0" style={{ borderColor: '#f3c6d0' }}>
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
        </div>

        {/* Social links on mobile */}
        <div className="flex sm:hidden items-center gap-3 text-xs pb-2" style={{ color: 'var(--bonnie-muted)' }}>
          <a href="https://x.com/bonnieofficialth_" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            @bonnieofficialth_
          </a>
          <span style={{ color: '#f3c6d0' }}>|</span>
          <a href="https://instagram.com/bonnieofficialth" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            bonnieofficialth
          </a>
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
          <footer className="py-8 text-xs" style={{ color: 'var(--bonnie-muted)' }}>
            <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
              <span>© Bonnie Official TH - Food Booster</span>
              <a href="/admin/login" style={{ color: '#d8b4be', textDecoration: 'none', fontSize: '10px' }}>Admin</a>
            </div>
          </footer>
        </LangProvider>
      </body>
    </html>
  )
}
