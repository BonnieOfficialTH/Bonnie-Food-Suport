'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { QueueItem, FoodCategory, FOOD_CATEGORY_LABELS, STATUS_LABELS, RegistrationStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'
import RichEditor from '@/components/RichEditor'

type AdminTab = 'rules' | 'notes' | 'queue'

const CATEGORIES: { key: FoodCategory; icon: string }[] = [
  { key: 'savory', icon: '🍱' },
  { key: 'dessert', icon: '🍰' },
  { key: 'drink', icon: '🧃' },
  { key: 'fruit', icon: '🍎' },
  { key: 'food_truck', icon: '🚚' },
]

const STATUSES: { value: RegistrationStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'รอดำเนินการ', color: '#7A5560' },
  { value: 'contacting', label: 'ระหว่างติดต่อ', color: '#2563eb' },
  { value: 'sent', label: 'ส่งแล้ว', color: '#16a34a' },
  { value: 'unavailable', label: 'ไม่สะดวกในรอบ', color: '#92400e' },
  { value: 'cancelled', label: 'ยกเลิกคิว', color: '#dc2626' },
]

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
  const activeOnly = sortedList.filter(i => activeStatuses.includes(i.status))
  return activeOnly.findIndex(i => i.id === item.id) + 1
}
function statusFg(s: RegistrationStatus) {
  switch(s) { case 'sent': return '#16a34a'; case 'contacting': return '#2563eb'; case 'cancelled': return '#dc2626'; case 'unavailable': return '#92400e'; default: return 'var(--bonnie-dark)' }
}
function statusBg(s: RegistrationStatus) {
  switch(s) { case 'sent': return '#dcfce7'; case 'contacting': return '#dbeafe'; case 'cancelled': return '#fee2e2'; case 'unavailable': return '#fef3c7'; default: return 'var(--bonnie-warm)' }
}

function EditableSection({ title, emoji, settingKey, placeholder, rows = 4 }: {
  title: string; emoji: string; settingKey: string; placeholder: string; rows?: number
}) {
  const [value, setValue] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', settingKey).single()
      .then(({ data }) => { if (data?.value) setValue(data.value) })
  }, [settingKey])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('settings').upsert({ key: settingKey, value: draft }, { onConflict: 'key' })
    setValue(draft); setEditing(false); setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl p-4 border mb-4" style={{ borderColor: '#f9dde5' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold" style={{ color: 'var(--bonnie-dark)' }}>{emoji} {title}</div>
        {!editing ? (
          <button onClick={() => { setDraft(value); setEditing(true) }}
            className="text-xs px-3 py-1 rounded-full border font-medium"
            style={{ borderColor: 'var(--bonnie-pink)', color: 'var(--bonnie-rose)', backgroundColor: 'white' }}>
            ✏️ แก้ไข
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1 rounded-full border"
              style={{ borderColor: '#e5e7eb', color: 'var(--bonnie-muted)', backgroundColor: 'white' }}>ยกเลิก</button>
            <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1 rounded-full text-white font-medium disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>
              {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <RichEditor value={draft} onChange={setDraft} placeholder={placeholder} rows={rows} />
      ) : (
        <div className="text-sm leading-relaxed min-h-[40px]" style={{ color: value ? 'var(--bonnie-dark)' : 'var(--bonnie-muted)' }}>
          {value ? <div className="rich-content" dangerouslySetInnerHTML={{ __html: value }} /> : <span className="italic text-xs">{placeholder}</span>}
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('queue')
  const [data, setData] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState<FoodCategory>('savory')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth(); fetchData()
    const ch = supabase.channel('admin-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_items' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/admin/login')
  }
  async function fetchData() {
    const { data: rows } = await supabase.from('queue_items').select('*').order('category_queue_number')
    setData(rows || []); setLoading(false)
  }
  async function updateStatus(id: string, status: RegistrationStatus) {
    setUpdating(id)
    await supabase.from('queue_items').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchData(); setUpdating(null)
  }

  const categoryData = sortQueue(data.filter(r => r.food_category === activeCat))

  const ADMIN_TABS: { key: AdminTab; label: string }[] = [
    { key: 'queue', label: '📋 จัดการคิว' },
    { key: 'rules', label: '📜 กติกา' },
    { key: 'notes', label: '📌 หมายเหตุ' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>Admin Dashboard</h1>
          <p className="text-xs" style={{ color: 'var(--bonnie-muted)' }}>Bonnie Food Support</p>
        </div>
        <div className="flex gap-2">
          <a href="/" className="text-xs px-4 py-2 rounded-full border font-medium"
            style={{ borderColor: 'var(--bonnie-pink)', color: 'var(--bonnie-rose)', backgroundColor: 'white' }}>🏠 หน้าหลัก</a>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login') }}
            className="text-xs px-4 py-2 rounded-full border"
            style={{ borderColor: '#f3c6d0', color: 'var(--bonnie-muted)', backgroundColor: 'white' }}>ออกจากระบบ</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'รอดำเนินการ', count: data.filter(r => r.status === 'pending').length, color: 'var(--bonnie-rose)' },
          { label: 'ส่งแล้ว', count: data.filter(r => r.status === 'sent').length, color: '#16a34a' },
          { label: 'ระหว่างติดต่อ', count: data.filter(r => r.status === 'contacting').length, color: '#2563eb' },
          { label: 'ยกเลิก', count: data.filter(r => r.status === 'cancelled').length, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-3 border text-center" style={{ borderColor: '#f9dde5' }}>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.count}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--bonnie-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: '#f9dde5' }}>
        {ADMIN_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2.5 text-xs font-semibold transition-colors relative flex-shrink-0"
            style={{ color: activeTab === tab.key ? 'var(--bonnie-rose)' : 'var(--bonnie-muted)' }}>
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: 'var(--bonnie-rose)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab: กติกา */}
      {activeTab === 'rules' && (
        <EditableSection
          title="BONNIE'S FOOD BOOSTER Detail and Agreement"
          emoji="📋"
          settingKey="house_rules"
          placeholder="พิมพ์กติกาและรายละเอียดที่นี่..."
          rows={10}
        />
      )}

      {/* Tab: หมายเหตุ */}
      {activeTab === 'notes' && (
        <div>
          <EditableSection title="อาหารที่ชอบ" emoji="❤️" settingKey="food_liked" placeholder="เช่น ข้าวมันไก่, ส้มตำ..." rows={4} />
          <EditableSection title="อาหารที่แพ้" emoji="⚠️" settingKey="allergy_notice" placeholder="เช่น หมู, อาหารทะเล, ถั่ว..." rows={4} />
        </div>
      )}

      {/* Tab: จัดการคิว */}
      {activeTab === 'queue' && (
        <div>
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(({ key, icon }) => {
              const pending = data.filter(r => r.food_category === key && ['pending','contacting','unavailable'].includes(r.status)).length
              return (
                <button key={key} onClick={() => setActiveCat(key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${activeCat === key ? 'tab-active' : 'tab-inactive'}`}>
                  {icon} {FOOD_CATEGORY_LABELS[key].th}
                  {pending > 0 && (
                    <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center"
                      style={{ backgroundColor: activeCat === key ? 'rgba(255,255,255,0.3)' : 'var(--bonnie-warm)', color: activeCat === key ? 'white' : 'var(--bonnie-rose)' }}>
                      {pending}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--bonnie-muted)' }}>กำลังโหลด...</div>
            ) : categoryData.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border text-sm" style={{ borderColor: '#f9dde5', color: 'var(--bonnie-muted)' }}>ยังไม่มีการลงทะเบียน</div>
            ) : categoryData.map(reg => (
              <div key={reg.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#f9dde5' }}>
                <div className="px-4 py-3.5 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                    style={{ backgroundColor: 'var(--bonnie-warm)', color: 'var(--bonnie-rose)' }}>
                    {getDisplayNumber(reg, categoryData) !== null ? `#${getDisplayNumber(reg, categoryData)}` : '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: statusFg(reg.status) }}>{reg.name}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--bonnie-muted)' }}>{reg.account}{reg.food_quantity ? ` · ${reg.food_quantity}` : ''}</div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                    style={{ backgroundColor: statusBg(reg.status), color: statusFg(reg.status) }}>
                    {STATUS_LABELS[reg.status].th}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--bonnie-muted)' }}>{expandedId === reg.id ? '▲' : '▼'}</span>
                </div>
                {expandedId === reg.id && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: '#f9dde5' }}>
                    <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                      {[
                        { label: 'ชื่อ', value: reg.name },
                        { label: 'แอคเคาท์', value: reg.account },
                        { label: 'ประเภท', value: reg.registration_type === 'food_support' ? 'Food Support' : 'Food Truck' },
                        reg.food_quantity ? { label: 'จำนวน', value: reg.food_quantity } : null,
                        { label: 'สะดวกติดต่อกลับ', value: reg.convenience_choice === 'convenient' ? '✓ สะดวก' : '✗ ไม่สะดวก' },
                        { label: 'ลงทะเบียนเมื่อ', value: new Date(reg.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) },
                      ].filter(Boolean).map((item: any) => (
                        <div key={item.label} className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bonnie-cream)' }}>
                          <div className="font-medium mb-0.5" style={{ color: 'var(--bonnie-muted)' }}>{item.label}</div>
                          <div style={{ color: 'var(--bonnie-dark)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs font-medium mb-2" style={{ color: 'var(--bonnie-muted)' }}>เปลี่ยนสถานะ</div>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map(s => (
                        <button key={s.value} onClick={() => updateStatus(reg.id, s.value)}
                          disabled={updating === reg.id || reg.status === s.value}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all disabled:opacity-50"
                          style={{ borderColor: reg.status === s.value ? s.color : 'transparent', backgroundColor: reg.status === s.value ? s.color + '20' : '#f9fafb', color: s.color }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
