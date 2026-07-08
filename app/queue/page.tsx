'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/lang-context'
import { QueueItem, FoodCategory, FOOD_CATEGORY_LABELS, STATUS_LABELS } from '@/lib/types'

const CATEGORIES: { key: FoodCategory; icon: string }[] = [
  { key: 'savory', icon: '🍱' },
  { key: 'dessert', icon: '🍰' },
  { key: 'drink', icon: '🧃' },
  { key: 'fruit', icon: '🍎' },
  { key: 'food_truck', icon: '🚚' },
]

function censor(str: string): string {
  if (!str) return ''
  const prefix = str.startsWith('@') ? '@' : ''
  const raw = prefix ? str.slice(1) : str
  if (raw.length <= 4) return prefix + raw[0] + '***'
  const start = Math.ceil(raw.length * 0.3)
  const end = Math.floor(raw.length * 0.7)
  return prefix + raw.slice(0, start) + '***' + raw.slice(end)
}

function sortQueue(items: QueueItem[]): QueueItem[] {
  // Split into groups
  const contacting = items.filter(i => i.status === 'contacting').sort((a,b) => a.category_queue_number - b.category_queue_number)
  const unavailable = items.filter(i => i.status === 'unavailable').sort((a,b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
  const sent = items.filter(i => i.status === 'sent').sort((a,b) => a.category_queue_number - b.category_queue_number)
  const cancelled = items.filter(i => i.status === 'cancelled').sort((a,b) => a.category_queue_number - b.category_queue_number)

  // For pending: split into "before unavailable" and "after unavailable"
  // based on whether they registered before or after any unavailable was marked
  const lastUnavailableTime = unavailable.length > 0
    ? Math.max(...unavailable.map(i => new Date(i.updated_at).getTime()))
    : 0

  const pendingBefore = items.filter(i => i.status === 'pending' && new Date(i.created_at).getTime() <= lastUnavailableTime).sort((a,b) => a.category_queue_number - b.category_queue_number)
  const pendingAfter = items.filter(i => i.status === 'pending' && new Date(i.created_at).getTime() > lastUnavailableTime).sort((a,b) => a.category_queue_number - b.category_queue_number)

  return [...contacting, ...pendingBefore, ...unavailable, ...pendingAfter, ...sent, ...cancelled]
}

function getDisplayNumber(item: QueueItem, sortedList: QueueItem[]): number | null {
  const activeStatuses = ['contacting', 'pending', 'unavailable']
  if (!activeStatuses.includes(item.status)) return null
  // cycling items have no display number
  const activeOnly = sortedList.filter(i => activeStatuses.includes(i.status))
  return activeOnly.findIndex(i => i.id === item.id) + 1
}

function statusColor(status: string) {
  switch(status) {
    case 'sent': return '#16a34a'
    case 'cycling': return '#059669'
    case 'contacting': return '#2563eb'
    case 'cancelled': return '#dc2626'
    default: return 'var(--bonnie-dark)'
  }
}
function statusBg(status: string) {
  switch(status) {
    case 'sent': return '#dcfce7'
    case 'cycling': return '#d1fae5'
    case 'contacting': return '#dbeafe'
    case 'cancelled': return '#fee2e2'
    default: return 'var(--bonnie-warm)'
  }
}

export default function QueuePage() {
  const { lang } = useLang()
  const [activeTab, setActiveTab] = useState<FoodCategory>('savory')
  const [data, setData] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_items' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchData() {
    const { data: rows } = await supabase.from('queue_items').select('*').order('category_queue_number')
    setData(rows || [])
    setLoading(false)
  }

  const categoryData = sortQueue(data.filter(r => r.food_category === activeTab))
  const pendingCount = (cat: FoodCategory) => data.filter(r => r.food_category === cat && ['pending','contacting','unavailable'].includes(r.status)).length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>
          {lang === 'th' ? 'ลำดับการลงทะเบียน' : 'Registration Queue'}
        </h1>

      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5 text-xs">
        {[
          { s: 'contacting', color: '#2563eb', label: { th: 'ระหว่างติดต่อ', en: 'Contacting' } },
          { s: 'pending', color: 'var(--bonnie-dark)', label: { th: 'รอดำเนินการ', en: 'Pending' } },
          { s: 'unavailable', color: '#92400e', label: { th: 'ไม่สะดวกในรอบ', en: 'Unavailable' } },
          { s: 'cycling', color: '#059669', label: { th: 'วนคิวส่งใหม่', en: 'Requeued' } },
          { s: 'sent', color: '#16a34a', label: { th: 'ส่งแล้ว', en: 'Sent' } },
          { s: 'cancelled', color: '#dc2626', label: { th: 'ยกเลิก', en: 'Cancelled' } },
        ].map(x => (
          <span key={x.s} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: x.color }} />
            <span style={{ color: 'var(--bonnie-muted)' }}>{x.label[lang]}</span>
          </span>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(({ key, icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${activeTab === key ? 'tab-active' : 'tab-inactive'}`}>
            {icon} {FOOD_CATEGORY_LABELS[key][lang]}
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
          <div className="text-center py-12 bg-white rounded-2xl border text-sm" style={{ borderColor: '#F3E8FF', color: 'var(--bonnie-muted)' }}>
            <div className="text-3xl mb-2">{CATEGORIES.find(c=>c.key===activeTab)?.icon}</div>
            {lang === 'th' ? 'ยังไม่มีการลงทะเบียนในหมวดนี้' : 'No registrations in this category yet'}
          </div>
        ) : categoryData.map(reg => (
          <div key={reg.id} className="bg-white rounded-2xl px-4 py-3.5 border flex items-center gap-3" style={{ borderColor: '#F3E8FF' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
              style={{ backgroundColor: 'var(--bonnie-warm)', color: 'var(--bonnie-rose)' }}>
              {getDisplayNumber(reg, categoryData) !== null ? `#${getDisplayNumber(reg, categoryData)}` : '—'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate" style={{ color: statusColor(reg.status) }}>
                {censor(reg.account)}
              </div>
              <div className="text-xs mt-0.5 flex flex-wrap gap-x-2" style={{ color: 'var(--bonnie-muted)' }}>
                {reg.food_quantity && <span>{reg.food_quantity}</span>}
                <span>{new Date(reg.status === 'pending' ? reg.created_at : reg.updated_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            </div>
            <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: statusBg(reg.status), color: statusColor(reg.status) }}>
              {reg.status === 'cycling' && (reg as any).cycle_count
                ? `${STATUS_LABELS[reg.status][lang]} รอบที่ ${(reg as any).cycle_count}`
                : STATUS_LABELS[reg.status][lang]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
