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
        <h1 className="text-3xl md:text-4xl font-bold mb-3"
          style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>
          BONNIE'S FOOD BOOSTER
        </h1>
        <p className="text-sm" style={{ color: 'var(--bonnie-muted)' }}>
          {lang === 'th' ? '💜 ก่อนลงทะเบียนรบกวนอ่านรายละเอียดและข้อตกลงก่อนนะคะ' : '💜 Please read the details and terms & conditions before registering.'}
        </p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1" style={{ backgroundColor: '#E9D5FF' }} />
        <h2 className="text-sm font-bold text-center" style={{ color: 'var(--bonnie-dark)', fontFamily: 'Georgia, serif' }}>
          {lang === 'th' ? 'รายละเอียดเงื่อนไขและข้อตกลงสำหรับการลงทะเบียน Food Support ของบอนนี่' : 'Food Support Registration Terms, Conditions, and Details'}
        </h2>
        <div className="h-px flex-1" style={{ backgroundColor: '#E9D5FF' }} />
      </div>

      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#F3E8FF' }}>
        {rules ? (
          <div className="text-sm leading-relaxed rich-content"
            dangerouslySetInnerHTML={{ __html: rules }} />
        ) : (
          <p className="text-sm text-center py-6" style={{ color: 'var(--bonnie-muted)' }}>
            {lang === 'th' ? 'ยังไม่มีกติกา' : 'No rules posted yet.'}
          </p>
        )}
      </div>
    </div>
  )
}
