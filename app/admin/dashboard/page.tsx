'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Registration, FoodCategory, FOOD_CATEGORY_LABELS, STATUS_LABELS, RegistrationStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'
import RichEditor from '@/components/RichEditor'

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

function sortQueue(items: Registration[]): Registration[] {
  const active = items.filter(i => ['pending','unavailable','contacting'].includes(i.status)).sort((a,b) => a.queue_number - b.queue_number)
  const sent = items.filter(i => i.status === 'sent').sort((a,b) => a.queue_number - b.queue_number)
  const cancelled = items.filter(i => i.status === 'cancelled').sort((a,b) => a.queue_number - b.queue_number)
  return [...active, ...sent, ...cancelled]
}
function statusFg(s: RegistrationStatus) {
  switch(s) { case 'sent': return '#16a34a'; case 'contacting': return '#2563eb'; case 'cancelled': return '#dc2626'; case 'unavailable': return '#92400e'; default: return 'var(--bonnie-muted)' }
}
function statusBg(s: RegistrationStatus) {
  switch(s) { case 'sent': return '#dcfce7'; case 'contacting': return '#dbeafe'; case 'cancelled': return '#fee2e2'; case 'unavailable': return '#fef3c7'; default: return 'var(--bonnie-warm)' }
}

export default function AdminDashboard() {
  const [data, setData] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FoodCategory>('savory')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [allergyNotice, setAllergyNotice] = useState('')
  const [savingNotice, setSavingNotice] = useState(false)
  const [houseRules, setHouseRules] = useState('')
  const [savingRules, setSavingRules] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchData()
    fetchNotice()
    fetchRules()
    const ch = supabase.channel('admin-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/admin/login')
  }
  async function fetchData() {
    const { data: rows } = await supabase.from('registrations').select('*').order('queue_number')
    setData(rows || [])
    setLoading(false)
  }
  async function fetchNotice() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'allergy_notice').single()
    if (data?.value) setAllergyNotice(data.value)
  }
  async function fetchRules() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'house_rules').single()
    if (data?.value) setHouseRules(data.value)
  }
  async function saveRules() {
    setSavingRules(true)
    await supabase.from('settings').upsert({ key: 'house_rules', value: houseRules }, { onConflict: 'key' })
    setSavingRules(false)
  }
  async function saveNotice() {
    setSavingNotice(true)
    await supabase.from('settings').upsert({ key: 'allergy_notice', value: allergyNotice }, { onConflict: 'key' })
    setSavingNotice(false)
  }
  async function updateStatus(id: string, status: RegistrationStatus) {
    setUpdating(id)
    await supabase.from('registrations').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchData()
    setUpdating(null)
  }
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const categoryData = sortQueue(data.filter(r => r.food_category === activeTab))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>Admin Dashboard</h1>
          <p className="text-xs" style={{ color: 'var(--bonnie-muted)' }}>Bonnie Food Support</p>
        </div>
        <button onClick={handleLogout} className="text-xs px-4 py-2 rounded-full border" style={{ borderColor: '#f3c6d0', color: 'var(--bonnie-muted)' }}>
          ออกจากระบบ
        </button>
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

      {/* Allergy Notice Editor */}
      <div className="bg-white rounded-2xl p-4 border mb-6" style={{ borderColor: '#f9dde5' }}>
        <div className="text-xs font-semibold mb-2" style={{ color: 'var(--bonnie-dark)' }}>
          ⚠️ ประกาศอาหารที่ขอให้หลีกเลี่ยง (แสดงในหน้าลงทะเบียน)
        </div>
        <RichEditor
          value={allergyNotice}
          onChange={setAllergyNotice}
          placeholder="เช่น หมู, อาหารทะเล, ถั่ว..."
          rows={3}
        />
        <button onClick={saveNotice} disabled={savingNotice}
          className="mt-2 px-4 py-2 rounded-xl text-white text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>
          {savingNotice ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>

      {/* House Rules Editor */}
      <div className="bg-white rounded-2xl p-4 border mb-6" style={{ borderColor: '#f9dde5' }}>
        <div className="text-xs font-semibold mb-2" style={{ color: 'var(--bonnie-dark)' }}>
          📋 กติกาของบ้าน (แสดงในหน้าแรก)
        </div>
        <RichEditor
          value={houseRules}
          onChange={setHouseRules}
          placeholder="พิมพ์กติกาของบ้านที่นี่..."
          rows={6}
        />
        <button onClick={saveRules} disabled={savingRules}
          className="mt-2 px-4 py-2 rounded-xl text-white text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>
          {savingRules ? 'กำลังบันทึก...' : 'บันทึกกติกา'}
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(({ key, icon }) => {
          const pending = data.filter(r => r.food_category === key && r.status === 'pending').length
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${activeTab === key ? 'tab-active' : 'tab-inactive'}`}>
              {icon} {FOOD_CATEGORY_LABELS[key].th}
              {pending > 0 && (
                <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center"
                  style={{ backgroundColor: activeTab === key ? 'rgba(255,255,255,0.3)' : 'var(--bonnie-warm)', color: activeTab === key ? 'white' : 'var(--bonnie-rose)' }}>
                  {pending}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Queue */}
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
                #{reg.queue_number}
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
                      style={{
                        borderColor: reg.status === s.value ? s.color : 'transparent',
                        backgroundColor: reg.status === s.value ? s.color + '20' : '#f9fafb',
                        color: s.color,
                      }}>
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
  )
}
