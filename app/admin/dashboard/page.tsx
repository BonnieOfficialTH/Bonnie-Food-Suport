'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { QueueItem, FoodCategory, FOOD_CATEGORY_LABELS, STATUS_LABELS, RegistrationStatus } from '@/lib/types'
import { useRouter } from 'next/navigation'
import RichEditor from '@/components/RichEditor'

type AdminTab = 'queue' | 'rules' | 'notes'

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

const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

function sortQueue(items: QueueItem[]): QueueItem[] {
  const statusOrder = { contacting: 0, pending: 1, unavailable: 2, cycling: 3, sent: 4, cancelled: 5 }
  const lastUnavailableTime = Math.max(
    0,
    ...items.filter(i => i.status === 'unavailable').map(i => new Date(i.updated_at).getTime())
  )
  return [...items].sort((a, b) => {
    const oa = statusOrder[a.status as keyof typeof statusOrder] ?? 9
    const ob = statusOrder[b.status as keyof typeof statusOrder] ?? 9
    if (oa !== ob) return oa - ob
    if (a.status === 'unavailable' && b.status === 'unavailable') {
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
    }
    if (a.status === 'pending' && b.status === 'pending') {
      const aAfter = new Date(a.created_at).getTime() > lastUnavailableTime
      const bAfter = new Date(b.created_at).getTime() > lastUnavailableTime
      if (aAfter !== bAfter) return aAfter ? 1 : -1
    }
    return a.category_queue_number - b.category_queue_number
  })
}

function getDisplayNumber(item: QueueItem, sortedList: QueueItem[]): number | null {
  const activeStatuses = ['contacting', 'pending', 'unavailable']
  if (!activeStatuses.includes(item.status)) return null
  const activeOnly = sortedList.filter(i => activeStatuses.includes(i.status))
  return activeOnly.findIndex(i => i.id === item.id) + 1
}

function statusFg(s: RegistrationStatus) {
  switch(s) { case 'sent': return '#16a34a'; case 'cycling': return '#059669'; case 'contacting': return '#2563eb'; case 'cancelled': return '#dc2626'; case 'unavailable': return '#92400e'; default: return 'var(--bonnie-dark)' }
}
function statusBg(s: RegistrationStatus) {
  switch(s) { case 'sent': return '#dcfce7'; case 'cycling': return '#d1fae5'; case 'contacting': return '#dbeafe'; case 'cancelled': return '#fee2e2'; case 'unavailable': return '#fef3c7'; default: return 'var(--bonnie-warm)' }
}

function EditableSection({ title, emoji, settingKey, placeholder, rows = 4, onAction }: {
  title: string; emoji: string; settingKey: string; placeholder: string; rows?: number; onAction?: () => void
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
    onAction?.()
  }

  return (
    <div className="bg-white rounded-2xl p-4 border mb-4" style={{ borderColor: '#F3E8FF' }}>
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
              style={{ background: 'linear-gradient(135deg, var(--bonnie-lavender), var(--bonnie-rose))' }}>
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
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<{id: string; status: RegistrationStatus; reg?: any; withCycle?: boolean; cycleRound?: string} | null>(null)
  const [unlockId, setUnlockId] = useState<string | null>(null)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [timeoutWarning, setTimeoutWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }, [router])

  const resetTimer = useCallback(() => {
    setTimeoutWarning(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    // Warn 1 minute before logout
    warningRef.current = setTimeout(() => {
      setTimeoutWarning(true)
      setRemainingSeconds(60)
      countdownRef.current = setInterval(() => {
        setRemainingSeconds(s => {
          if (s <= 1) { clearInterval(countdownRef.current!); return 0 }
          return s - 1
        })
      }, 1000)
    }, TIMEOUT_MS - 60000)

    timeoutRef.current = setTimeout(() => {
      handleLogout()
    }, TIMEOUT_MS)
  }, [handleLogout])

  useEffect(() => {
    checkAuth()
    fetchData()
    resetTimer()

    const ch = supabase.channel('admin-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_items' }, fetchData)
      .subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      supabase.removeChannel(ch)
    }
  }, [resetTimer])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/admin/login')
  }
  async function fetchData() {
    const { data: rows } = await supabase.from('queue_items').select('*').order('category_queue_number')
    setData(rows || []); setLoading(false)
  }
  async function unlockAndEdit() {
    if (!unlockId) return
    setUnlocking(true)
    setUnlockError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) { setUnlockError('ไม่พบ session'); setUnlocking(false); return }
    const { error } = await supabase.auth.signInWithPassword({ email: session.user.email, password: unlockPassword })
    if (error) { setUnlockError('รหัสผ่านไม่ถูกต้อง'); setUnlocking(false); return }
    // Find the reg and open pendingStatus for it
    const reg = data.find(r => r.id === unlockId)
    setUnlockId(null)
    setUnlockPassword('')
    setUnlockError('')
    setUnlocking(false)
    if (reg) setPendingStatus({ id: unlockId!, status: reg.status, reg })
  }

  async function deleteItem() {
    if (!deleteId) return
    setDeleting(true)
    setDeleteError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) { setDeleteError('ไม่พบข้อมูล session'); setDeleting(false); return }
    const { error } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: deletePassword,
    })
    if (error) { setDeleteError('รหัสผ่านไม่ถูกต้อง'); setDeleting(false); return }
    await supabase.from('queue_items').delete().eq('id', deleteId)
    await fetchData()
    setDeleteId(null)
    setDeletePassword('')
    setDeleteError('')
    setDeleting(false)
  }

  async function cycleQueue(reg: any, round?: number) {
    // Mark current as cycling
    // First cycle = round 2 (already sent round 1)
    const cycleCount = (reg as any).cycle_count ? (reg as any).cycle_count + 1 : 2
    await supabase.from('queue_items').update({
      status: 'cycling',
      cycle_count: cycleCount,
      updated_at: new Date().toISOString()
    }).eq('id', reg.id)

    // Get next queue number for this category
    const { data: maxRow } = await supabase
      .from('queue_items')
      .select('category_queue_number')
      .eq('food_category', reg.food_category)
      .order('category_queue_number', { ascending: false })
      .limit(1)
      .single()

    const nextNum = maxRow ? maxRow.category_queue_number + 1 : 1

    // Create new queue item
    await supabase.from('queue_items').insert([{
      registration_id: reg.registration_id,
      name: reg.name,
      account: reg.account,
      food_category: reg.food_category,
      food_quantity: reg.food_quantity,
      registration_type: reg.registration_type,
      convenience_choice: reg.convenience_choice,
      status: 'pending',
      category_queue_number: nextNum,
      cycle_count: 0,
      cycle_round: cycleCount,
    }])

    await fetchData()
    resetTimer()
  }

  async function confirmStatus() {
    if (!pendingStatus) return
    setUpdating(pendingStatus.id)
    // Save the status first
    await supabase.from('queue_items').update({ status: pendingStatus.status, updated_at: new Date().toISOString() }).eq('id', pendingStatus.id)
    // If withCycle, also create new queue item
    if (pendingStatus.withCycle && pendingStatus.reg) {
      const round = parseInt(pendingStatus.cycleRound || '2') || 2
      await cycleQueue(pendingStatus.reg, round)
    } else {
      await fetchData()
    }
    setPendingStatus(null)
    setUpdating(null)
    resetTimer()
  }

  async function updateStatus(id: string, status: RegistrationStatus) {
    const reg = data.find(r => r.id === id)
    setPendingStatus({ id, status, reg })
  }

  const categoryData = sortQueue(data.filter(r => r.food_category === activeCat))

  const ADMIN_TABS: { key: AdminTab; label: string }[] = [
    { key: 'queue', label: '📋 จัดการคิว' },
    { key: 'rules', label: '📜 กติกา' },
    { key: 'notes', label: '📌 หมายเหตุ' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Unlock modal for sent/cancelled */}
      {unlockId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border" style={{ borderColor: '#E9D5FF' }}>
            <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>
              ยืนยันตัวตนก่อนแก้ไข
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--bonnie-muted)' }}>ใส่รหัสผ่าน Admin เพื่อแก้ไขสถานะนี้</p>
            <input type="password" value={unlockPassword}
              onChange={e => { setUnlockPassword(e.target.value); setUnlockError('') }}
              placeholder="รหัสผ่าน" autoFocus
              onKeyDown={e => e.key === 'Enter' && unlockAndEdit()}
              className="w-full px-4 py-3 rounded-xl border text-sm bg-white mb-3"
              style={{ borderColor: '#E9D5FF', color: 'var(--bonnie-dark)' }} />
            {unlockError && <p className="text-xs text-red-600 mb-3">{unlockError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setUnlockId(null); setUnlockPassword(''); setUnlockError('') }}
                className="flex-1 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: '#E9D5FF', color: 'var(--bonnie-muted)', backgroundColor: 'white' }}>
                ยกเลิก
              </button>
              <button onClick={unlockAndEdit} disabled={unlocking || !unlockPassword}
                className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--bonnie-lavender), var(--bonnie-rose))' }}>
                {unlocking ? 'กำลังตรวจสอบ...' : '🔓 ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm status change modal */}
      {pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border" style={{ borderColor: '#E9D5FF' }}>
            <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>
              ยืนยันการเปลี่ยนสถานะ
            </h3>
            <p className="text-sm mb-1" style={{ color: 'var(--bonnie-muted)' }}>เปลี่ยนเป็น</p>
            <div className="px-4 py-2.5 rounded-xl text-sm font-semibold mb-4 text-center"
              style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              {STATUS_LABELS[pendingStatus.status]?.th}
            </div>
            {/* Show cycle option only when status is sent */}
            {pendingStatus.status === 'sent' && (
              <div className="mb-4 p-3 rounded-xl border" style={{ borderColor: '#6ee7b7', backgroundColor: '#f0fdf4' }}>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox"
                    checked={pendingStatus.withCycle || false}
                    onChange={e => setPendingStatus(prev => prev ? { ...prev, withCycle: e.target.checked } : null)}
                    className="w-4 h-4 accent-green-500" />
                  <span className="text-xs font-medium" style={{ color: '#059669' }}>🔄 วนคิวส่งใหม่</span>
                </label>
                {pendingStatus.withCycle && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: '#059669' }}>รอบที่</span>
                    <input
                      type="number" min="2"
                      value={pendingStatus.cycleRound || ''}
                      onChange={e => setPendingStatus(prev => prev ? { ...prev, cycleRound: e.target.value } : null)}
                      placeholder="2"
                      className="w-16 px-2 py-1 rounded-lg border text-sm text-center"
                      style={{ borderColor: '#6ee7b7', color: 'var(--bonnie-dark)' }}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setPendingStatus(null)}
                className="flex-1 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: '#E9D5FF', color: 'var(--bonnie-muted)', backgroundColor: 'white' }}>
                ยกเลิก
              </button>
              <button onClick={confirmStatus} disabled={!!updating}
                className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--bonnie-lavender), var(--bonnie-rose))' }}>
                {updating ? 'กำลังบันทึก...' : '✓ บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border" style={{ borderColor: '#E9D5FF' }}>
            <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>
              ยืนยันการลบคิว
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--bonnie-muted)' }}>
              กรุณาใส่รหัสผ่าน Admin เพื่อยืนยัน
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={e => { setDeletePassword(e.target.value); setDeleteError('') }}
              placeholder="รหัสผ่าน"
              onKeyDown={e => e.key === 'Enter' && deleteItem()}
              className="w-full px-4 py-3 rounded-xl border text-sm bg-white mb-3"
              style={{ borderColor: '#E9D5FF', color: 'var(--bonnie-dark)' }}
              autoFocus
            />
            {deleteError && <p className="text-xs text-red-600 mb-3">{deleteError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setDeleteId(null); setDeletePassword(''); setDeleteError('') }}
                className="flex-1 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: '#E9D5FF', color: 'var(--bonnie-muted)', backgroundColor: 'white' }}>
                ยกเลิก
              </button>
              <button onClick={deleteItem} disabled={deleting || !deletePassword}
                className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: '#dc2626' }}>
                {deleting ? 'กำลังลบ...' : '🗑 ลบคิวนี้'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-logout warning */}
      {timeoutWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', minWidth: 280 }}>
          <span>⏱️ จะออกจากระบบใน {remainingSeconds} วินาที</span>
          <button onClick={resetTimer} className="px-3 py-1 rounded-xl bg-white text-xs font-bold"
            style={{ color: '#ef4444' }}>
            ยังอยู่
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>Admin Dashboard</h1>
          <p className="text-xs" style={{ color: 'var(--bonnie-muted)' }}>Bonnie Food Support · ออกอัตโนมัติเมื่อไม่มีการแก้ไข 10 นาที</p>
        </div>
        <div className="flex gap-2">
          <a href="/" className="text-xs px-4 py-2 rounded-full border font-medium"
            style={{ borderColor: 'var(--bonnie-pink)', color: 'var(--bonnie-rose)', backgroundColor: 'white' }}>🏠 หน้าหลัก</a>
          <button onClick={handleLogout} className="text-xs px-4 py-2 rounded-full border"
            style={{ borderColor: '#E9D5FF', color: 'var(--bonnie-muted)', backgroundColor: 'white' }}>ออกจากระบบ</button>
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
          <div key={s.label} className="bg-white rounded-2xl p-3 border text-center" style={{ borderColor: '#F3E8FF' }}>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'Georgia, serif' }}>{s.count}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--bonnie-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 mb-6 border-b" style={{ borderColor: '#F3E8FF' }}>
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
        <div>
          <EditableSection title="รายละเอียด (ภาษาไทย)" emoji="🇹🇭" settingKey="house_rules_th" placeholder="พิมพ์กติกาภาษาไทยที่นี่..." rows={8} onAction={resetTimer} />
          <EditableSection title="Details (English)" emoji="🇬🇧" settingKey="house_rules_en" placeholder="Enter rules in English here..." rows={8} onAction={resetTimer} />
        </div>
      )}

      {/* Tab: หมายเหตุ */}
      {activeTab === 'notes' && (
        <div>
          <EditableSection title="อาหารที่แนะนำ" emoji="❤️" settingKey="food_liked" placeholder="เช่น ข้าวมันไก่, ส้มตำ..." rows={4} onAction={resetTimer} />
          <EditableSection title="อาหารที่แพ้" emoji="⚠️" settingKey="allergy_notice" placeholder="เช่น หมู, อาหารทะเล, ถั่ว..." rows={4} onAction={resetTimer} />
        </div>
      )}

      {/* Tab: จัดการคิว */}
      {activeTab === 'queue' && (
        <div>
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
              <div className="text-center py-10 bg-white rounded-2xl border text-sm" style={{ borderColor: '#F3E8FF', color: 'var(--bonnie-muted)' }}>ยังไม่มีการลงทะเบียน</div>
            ) : categoryData.map(reg => (
              <div key={reg.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#F3E8FF' }}>
                <div className="px-4 py-3.5 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                    style={{ backgroundColor: 'var(--bonnie-warm)', color: 'var(--bonnie-rose)' }}>
                    {getDisplayNumber(reg, categoryData) !== null ? `#${getDisplayNumber(reg, categoryData)}` : '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: statusFg(reg.status) }}>{reg.name}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--bonnie-muted)' }}>{reg.account}{reg.food_quantity ? ` · ${reg.food_quantity}` : ''}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#b0919a' }}>
                      {reg.status === 'pending' && (reg as any).cycle_round > 0
                        ? `ลงทะเบียน ${new Date(reg.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })} · วนคิวส่งใหม่รอบที่ ${(reg as any).cycle_round}`
                        : reg.status === 'cycling'
                        ? `อัปเดต ${new Date(reg.updated_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })} · ส่งแล้ว วนคิวส่งใหม่รอบที่ ${(reg as any).cycle_count || 2}`
                        : reg.status === 'pending'
                        ? `ลงทะเบียน ${new Date(reg.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}`
                        : `อัปเดต ${new Date(reg.updated_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}`}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                    style={{ backgroundColor: statusBg(reg.status), color: statusFg(reg.status) }}>
                    {STATUS_LABELS[reg.status].th}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--bonnie-muted)' }}>{expandedId === reg.id ? '▲' : '▼'}</span>
                </div>
                {expandedId === reg.id && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: '#F3E8FF' }}>
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium" style={{ color: 'var(--bonnie-muted)' }}>เปลี่ยนสถานะ</div>
                      {['sent','cancelled'].includes(reg.status) && (
                        <button onClick={() => { setUnlockId(reg.id); setUnlockPassword(''); setUnlockError('') }}
                          className="text-xs px-3 py-1 rounded-full border font-medium"
                          style={{ borderColor: '#E9D5FF', color: 'var(--bonnie-rose)', backgroundColor: 'white' }}>
                          🔓 แก้ไข
                        </button>
                      )}
                    </div>
                    {['sent','cancelled'].includes(reg.status) ? (
                      <p className="text-xs py-2" style={{ color: 'var(--bonnie-muted)' }}>
                        กด "แก้ไข" เพื่อเปลี่ยนสถานะนี้
                      </p>
                    ) : (
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
                    )}
                    <div className="mt-3 pt-3 border-t flex justify-end" style={{ borderColor: '#F3E8FF' }}>
                      <button onClick={() => { setDeleteId(reg.id); setDeletePassword(''); setDeleteError('') }}
                        className="text-xs px-3 py-1.5 rounded-xl border font-medium"
                        style={{ borderColor: '#fca5a5', color: '#dc2626', backgroundColor: '#fef2f2' }}>
                        🗑 ลบคิวนี้
                      </button>
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
