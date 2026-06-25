'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // If already logged in, go straight to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/admin/dashboard')
      else setLoading(false)
    })
  }, [router])

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      setLoading(false)
      return
    }
    router.push('/admin/dashboard')
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm bg-white"
  const inpStyle = { borderColor: '#f3c6d0', color: 'var(--bonnie-dark)' }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-sm" style={{ color: 'var(--bonnie-muted)' }}>กำลังโหลด...</div>
    </div>
  )

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-8">
        <img src="/logo.png" alt="Bonnie" className="h-16 w-auto mx-auto mb-4 object-contain" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>
          Admin Login
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--bonnie-muted)' }}>Bonnie Food Support</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border" style={{ borderColor: '#f9dde5' }}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--bonnie-muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@bonnie.com" className={inp} style={inpStyle}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--bonnie-muted)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className={inp} style={inpStyle}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 rounded-2xl text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  )
}
