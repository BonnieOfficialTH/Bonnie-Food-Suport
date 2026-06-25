'use client'

import { useLang } from '@/lib/lang-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const { lang } = useLang()
  const [rules, setRules] = useState('')

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'house_rules').single()
      .then(({ data }) => { if (data?.value) setRules(data.value) })
  }, [])

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-4"
          style={{ backgroundColor: 'var(--bonnie-warm)', color: 'var(--bonnie-rose)' }}>
          🌸 {lang === 'th' ? 'ยินดีต้อนรับสู่บ้านบอนนี่' : "Welcome to Bonnie's House"}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3"
          style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>
          Food Support
        </h1>
        <p className="text-sm" style={{ color: 'var(--bonnie-muted)' }}>
          {lang === 'th' ? 'อ่านกติกาให้ครบก่อนลงทะเบียนนะคะ' : 'Please read all rules before registering.'}
        </p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1" style={{ backgroundColor: '#f3c6d0' }} />
        <h2 className="text-base font-bold" style={{ color: 'var(--bonnie-dark)', fontFamily: 'Georgia, serif' }}>
          {lang === 'th' ? 'กติกาของบ้าน' : 'House Rules'}
        </h2>
        <div className="h-px flex-1" style={{ backgroundColor: '#f3c6d0' }} />
      </div>

      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#f9dde5' }}>
        {rules ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--bonnie-dark)' }}>
            {rules}
          </p>
        ) : (
          <p className="text-sm text-center py-6" style={{ color: 'var(--bonnie-muted)' }}>
            {lang === 'th' ? 'ยังไม่มีกติกา' : 'No rules posted yet.'}
          </p>
        )}
      </div>
    </div>
  )
}
