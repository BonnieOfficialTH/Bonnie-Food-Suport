'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/lang-context'
import { Registration, FoodCategory, FOOD_CATEGORY_LABELS, STATUS_LABELS } from '@/lib/types'

const CATEGORIES: { key: FoodCategory; icon: string }[] = [
  { key: 'savory', icon: '🍱' },
  { key: 'dessert', icon: '🍰' },
  { key: 'drink', icon: '🧃' },
  { key: 'fruit', icon: '🍎' },
  { key: 'food_truck', icon: '🚚' },
]

function sortQueue(items: Registration[]): Registration[] {
  const active = items.filter(i => ['pending','unavailable','contacting'].includes(i.status)).sort((a,b) => a.queue_number - b.queue_number)
  const sent = items.filter(i => i.status === 'sent').sort((a,b) => a.queue_number - b.queue_number)
  const cancelled = items.filter(i => i.status === 'cancelled').sort((a,b) => a.queue_number - b.queue_number)
  return [...active, ...sent, ...cancelled]
}

function statusColor(status: string) {
  switch(status) {
    case 'sent': return '#16a34a'
    case 'contacting': return '#2563eb'
    case 'cancelled': return '#dc2626'
    default: return 'var(--bonnie-dark)'
  }
}
function statusBg(status: string) {
  switch(status) {
    case 'sent': return '#dcfce7'
    case 'contacting': return '#dbeafe'
    case 'cancelled': return '#fee2e2'
    default: return 'var(--bonnie-warm)'
  }
}

export default function QueuePage() {
  const { lang } = useLang()
  const [activeTab, setActiveTab] = useState<FoodCategory>('savory')
  const [data, setData] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchData() {
    const { data: rows } = await supabase.from('registrations').select('*').order('queue_number')
    setData(rows || [])
    setLoading(false)
  }

  const categoryData = sortQueue(data.filter(r => r.food_category === activeTab))
  const pendingCount = (cat: FoodCategory) => data.filter(r => r.food_category === cat && r.status === 'pending').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>
          {lang === 'th' ? 'คิวการลงทะเบียน' : 'Registration Queue'}
        </h1>
        <p className="text-xs" style={{ color: 'var(--bonnie-muted)' }}>
          {lang === 'th' ? '🔄 อัปเดตอัตโนมัติ' : '🔄 Auto-updates in real time'}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5 text-xs">
        {[
          { s: 'pending', color: 'var(--bonnie-dark)', label: { th: 'รอดำเนินการ', en: 'Pending' } },
          { s: 'contacting', color: '#2563eb', label: { th: 'ระหว่างติดต่อ', en: 'In Contact' } },
          { s: 'sent', color: '#16a34a', label: { th: 'ส่งแล้ว', en: 'Sent' } },
          { s: 'unavailable', color: '#92400e', label: { th: 'ไม่สะดวกในรอบ', en: 'Unavailable' } },
          { s: 'cancelled', color: '#dc2626', label: { th: 'ยกเลิก', en: 'Cancelled' } },
        ].map(x => (
          <span key={x.s} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: x.color }} />
            <span style={{ color: 'var(--bonnie-muted)' }}>{x.label[lang]}</span>
          </span>
        ))}
      </div>

      {/* Category tabs — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(({ key, icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${activeTab === key ? 'tab-active' : 'tab-inactive'}`}>
            {icon}
            <span>{FOOD_CATEGORY_LABELS[key][lang]}</span>
            {pendingCount(key) > 0 && (
              <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center"
                style={{ backgroundColor: activeTab === key ? 'rgba(255,255,255,0.3)' : 'var(--bonnie-warm)', color: activeTab === key ? 'white' : 'var(--bonnie-rose)' }}>
                {pendingCount(key)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Queue list */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--bonnie-muted)' }}>
            {lang === 'th' ? 'กำลังโหลด...' : 'Loading...'}
          </div>
        ) : categoryData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border text-sm" style={{ borderColor: '#f9dde5', color: 'var(--bonnie-muted)' }}>
            <div className="text-3xl mb-2">{CATEGORIES.find(c=>c.key===activeTab)?.icon}</div>
            {lang === 'th' ? 'ยังไม่มีการลงทะเบียนในหมวดนี้' : 'No registrations in this category yet'}
          </div>
        ) : categoryData.map(reg => (
          <div key={reg.id} className="bg-white rounded-2xl px-4 py-3.5 border flex items-center gap-3" style={{ borderColor: '#f9dde5' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
              style={{ backgroundColor: 'var(--bonnie-warm)', color: 'var(--bonnie-rose)' }}>
              #{reg.queue_number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: statusColor(reg.status) }}>
                {reg.name}
              </div>
              <div className="text-xs truncate mt-0.5" style={{ color: 'var(--bonnie-muted)' }}>
                {reg.account}{reg.food_quantity ? ` · ${reg.food_quantity}` : ''}
              </div>
            </div>
            <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: statusBg(reg.status), color: statusColor(reg.status) }}>
              {STATUS_LABELS[reg.status][lang]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
