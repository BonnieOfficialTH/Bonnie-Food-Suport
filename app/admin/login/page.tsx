'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

  const inputClass = "w-full px-4 py-3 rounded-xl border text-sm bg-white"
  const inputStyle = { borderColor: '#f3c6d0', color: 'var(--bonnie-dark)' }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>
          B
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>
          Admin Login
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--bonnie-muted)' }}>Bonnie Food Support</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border" style={{ borderColor: '#f9dde5' }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--bonnie-muted)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@bonnie.com"
              className={inputClass} style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--bonnie-muted)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass} style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 rounded-2xl text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </div>
      </div>
    </div>
  )
}
