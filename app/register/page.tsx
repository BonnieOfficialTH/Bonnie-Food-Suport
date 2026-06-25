'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/lang-context'
import { FoodCategory, FOOD_CATEGORY_LABELS } from '@/lib/types'
import Link from 'next/link'

type RegType = 'food_support' | 'food_truck'
type FoodCat = 'savory' | 'dessert' | 'drink' | 'fruit'

const tx = {
  th: {
    title: 'ลงทะเบียน',
    allergyNotice: '⚠️ อาหารที่แพ้',
    allergyEmpty: 'ไม่มีประกาศในขณะนี้',
    nameLabel: 'ชื่อ', namePlaceholder: 'ชื่อของท่าน',
    accountLabel: 'แอคเคาท์', accountPlaceholder: '@username หรือ Account ที่ใช้ติดต่อ',
    typeLabel: 'ต้องการส่งแบบ',
    foodSupport: 'Food Support', foodTruck: 'Food Truck',
    catLabel: 'ประเภทอาหาร (เลือกได้หลายข้อ)',
    savory: 'อาหารคาว', dessert: 'ของหวาน', drink: 'เครื่องดื่ม', fruit: 'ผลไม้',
    qtyLabel: 'จำนวนของอาหาร', qtyPlaceholder: 'เช่น ข้าวมันไก่ 30 กล่อง',
    termsTitle: 'เงื่อนไขก่อนลงทะเบียน',
    cond1: 'กรณีที่เรียกคิวลงทะเบียนครบแล้ว และยังมีช่วงวันหรือเวลาว่างคงเหลือ ทางบ้านขออนุญาตติดต่อกลับเพื่อดำเนินการส่ง Food Support / Food Truck โดยเรียงตามหมวดหมู่ทันที ท่านสะดวกให้ดำเนินการในลักษณะนี้หรือไม่คะ?',
    convenient: 'สะดวก', notConvenient: 'ไม่สะดวก',
    cond2: 'ท่านได้อ่านรายละเอียดและข้อตกลงอย่างครบถ้วน และยอมรับเงื่อนไขทั้งหมดแล้วก่อนลงทะเบียน',
    submit: 'ส่งข้อมูล', submitting: 'กำลังส่ง...',
    successTitle: 'ลงทะเบียนสำเร็จ! 🌸', successMsg: 'ขอบคุณค่ะ ข้อมูลของท่านได้รับการบันทึกแล้ว',
    queueResult: 'เลขคิวที่ได้รับ', viewQueue: 'ดูคิวทั้งหมด', registerAnother: 'ลงทะเบียนใหม่',
    errRequired: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    errCat: 'กรุณาเลือกประเภทอาหารอย่างน้อย 1 ประเภท',
    errCond1: 'กรุณาเลือกว่าสะดวกหรือไม่สะดวก',
    errCond2: 'กรุณายอมรับเงื่อนไขของทางบ้านก่อน',
    errServer: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
  },
  en: {
    title: 'Register',
    allergyNotice: '⚠️ Food Allergies',
    allergyEmpty: 'No announcements at this time',
    nameLabel: 'Name', namePlaceholder: 'Your name',
    accountLabel: 'Account', accountPlaceholder: '@username or contact account',
    typeLabel: 'Delivery Type',
    foodSupport: 'Food Support', foodTruck: 'Food Truck',
    catLabel: 'Food Category (select multiple)',
    savory: 'Savory Food', dessert: 'Dessert', drink: 'Drinks', fruit: 'Fruits',
    qtyLabel: 'Food Quantity', qtyPlaceholder: 'e.g. Chicken rice 30 boxes',
    termsTitle: 'Pre-registration Terms',
    cond1: 'If the registration queue is full but there are remaining time slots, may the team contact you to arrange delivery of Food Support / Food Truck ordered by category immediately?',
    convenient: 'Convenient', notConvenient: 'Not Convenient',
    cond2: 'I have read and understood the details, terms, and conditions in full, and I agree to all conditions prior to registration.',
    submit: 'Submit', submitting: 'Submitting...',
    successTitle: 'Registered Successfully! 🌸', successMsg: 'Thank you! Your information has been recorded.',
    queueResult: 'Your Queue Numbers',viewQueue: 'View All Queues', registerAnother: 'Register Again',
    errRequired: 'Please fill in all required fields.',
    errCat: 'Please select at least one food category.',
    errCond1: 'Please select convenient or not convenient.',
    errCond2: 'Please accept the house rules before submitting.',
    errServer: 'An error occurred. Please try again.',
  },
}

// Censor middle of string
function censor(str: string): string {
  if (!str) return ''
  if (str.length <= 4) return str[0] + '***'
  const start = Math.ceil(str.length * 0.3)
  const end = Math.floor(str.length * 0.7)
  return str.slice(0, start) + '***' + str.slice(end)
}

export default function RegisterPage() {
  const { lang } = useLang()
  const t = tx[lang]

  const [allergyNotice, setAllergyNotice] = useState('')
  const [foodLiked, setFoodLiked] = useState('')
  const [name, setName] = useState('')
  const [account, setAccount] = useState('')
  const [regType, setRegType] = useState<RegType | ''>('')
  const [foodCats, setFoodCats] = useState<FoodCat[]>([])
  const [quantities, setQuantities] = useState<Record<FoodCat, string>>({ savory: '', dessert: '', drink: '', fruit: '' })
  const [convenience, setConvenience] = useState<'convenient' | 'not_convenient' | ''>('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ items: { category: string; queueNum: number }[] } | null>(null)

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'allergy_notice').single().then(({ data }) => { if (data?.value) setAllergyNotice(data.value) })
    supabase.from('settings').select('value').eq('key', 'food_liked').single().then(({ data }) => { if (data?.value) setFoodLiked(data.value) })
  }, [])

  const toggleCat = (cat: FoodCat) => {
    setFoodCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const handleSubmit = async () => {
    setError('')
    if (!name || !account || !regType) { setError(t.errRequired); return }
    if (regType === 'food_support' && foodCats.length === 0) { setError(t.errCat); return }
    if (regType === 'food_support' && foodCats.some(c => !quantities[c])) { setError(t.errRequired); return }
    if (!convenience) { setError(t.errCond1); return }
    if (!acceptedTerms) { setError(t.errCond2); return }

    setLoading(true)
    try {
      const registrationId = crypto.randomUUID()
      const categories = regType === 'food_truck' ? ['food_truck'] : foodCats

      const insertData = categories.map(cat => ({
        registration_id: registrationId,
        name, account,
        food_category: cat,
        food_quantity: cat === 'food_truck' ? null : quantities[cat as FoodCat],
        registration_type: regType,
        convenience_choice: convenience,
        category_queue_number: 0, // will be set by DB function
        status: 'pending',
      }))

      // Insert each category — queue number auto-assigned by DB trigger
      const results: { category: string; queueNum: number }[] = []
      for (const item of insertData) {
        // Get current max for this category and increment
        const { data: maxRow } = await supabase
          .from('queue_items')
          .select('category_queue_number')
          .eq('food_category', item.food_category)
          .order('category_queue_number', { ascending: false })
          .limit(1)
          .single()
        
        const nextNum = maxRow ? maxRow.category_queue_number + 1 : 1
        
        const { data, error: err } = await supabase
          .from('queue_items')
          .insert([{ ...item, category_queue_number: nextNum }])
          .select('category_queue_number, food_category')
          .single()
        if (err) throw err
        results.push({ category: data.food_category, queueNum: data.category_queue_number })
      }
      setSuccess({ items: results })
    } catch {
      setError(t.errServer)
    } finally {
      setLoading(false)
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm bg-white"
  const inpStyle = { borderColor: '#E9D5FF', color: 'var(--bonnie-dark)' }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🌸</div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>{t.successTitle}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--bonnie-muted)' }}>{t.successMsg}</p>
        <div className="rounded-2xl p-6 mb-6 mx-auto max-w-sm" style={{ backgroundColor: 'var(--bonnie-warm)' }}>
          <div className="text-xs mb-3 font-semibold" style={{ color: 'var(--bonnie-muted)' }}>{t.queueResult}</div>
          <div className="space-y-2">
            {success.items.map(item => (
              <div key={item.category} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5">
                <span className="text-sm" style={{ color: 'var(--bonnie-muted)' }}>
                  {FOOD_CATEGORY_LABELS[item.category as keyof typeof FOOD_CATEGORY_LABELS][lang]}
                </span>
                <span className="text-xl font-bold" style={{ color: 'var(--bonnie-rose)', fontFamily: 'Georgia, serif' }}>
                  #{item.queueNum}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/queue" className="px-5 py-2.5 rounded-full text-white text-sm"
            style={{ background: 'linear-gradient(135deg, var(--bonnie-lavender), var(--bonnie-rose))' }}>{t.viewQueue}</Link>
          <button onClick={() => { setSuccess(null); setName(''); setAccount(''); setRegType(''); setFoodCats([]); setQuantities({ savory: '', dessert: '', drink: '', fruit: '' }); setConvenience(''); setAcceptedTerms(false) }}
            className="px-5 py-2.5 rounded-full text-sm border"
            style={{ borderColor: 'var(--bonnie-pink)', color: 'var(--bonnie-rose)', backgroundColor: 'white' }}>{t.registerAnother}</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>{t.title}</h1>
      <div className="bg-white rounded-3xl p-5 md:p-7 border space-y-5" style={{ borderColor: '#F3E8FF' }}>

        {/* Notices */}
        <div className="space-y-3">
          {foodLiked && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
              <div className="text-xs font-semibold mb-1.5" style={{ color: '#15803d' }}>❤️ {lang === 'th' ? 'อาหารที่แนะนำ' : 'Recommended Foods'}</div>
              <div className="text-sm leading-relaxed rich-content" style={{ color: '#14532d' }} dangerouslySetInnerHTML={{ __html: foodLiked }} />
            </div>
          )}
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff7ed', border: '1.5px solid #fed7aa' }}>
            <div className="text-xs font-semibold mb-1.5" style={{ color: '#c2410c' }}>{t.allergyNotice}</div>
            {allergyNotice
              ? <div className="text-sm leading-relaxed rich-content" style={{ color: '#7c2d12' }} dangerouslySetInnerHTML={{ __html: allergyNotice }} />
              : <p className="text-sm" style={{ color: 'var(--bonnie-muted)' }}>{t.allergyEmpty}</p>}
          </div>
        </div>

        {/* Name & Account */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--bonnie-muted)' }}>{t.nameLabel} *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder} className={inp} style={inpStyle} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--bonnie-muted)' }}>{t.accountLabel} *</label>
            <input value={account} onChange={e => setAccount(e.target.value)} placeholder={t.accountPlaceholder} className={inp} style={inpStyle} />
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--bonnie-muted)' }}>{t.typeLabel} *</label>
          <div className="grid grid-cols-2 gap-3">
            {(['food_support', 'food_truck'] as RegType[]).map(type => (
              <button key={type} onClick={() => { setRegType(type); setFoodCats([]) }}
                className="py-3 rounded-xl text-sm font-medium border-2 transition-all"
                style={regType === type
                  ? { background: 'linear-gradient(135deg, var(--bonnie-lavender), var(--bonnie-rose))', color: 'white', borderColor: 'var(--bonnie-rose)' }
                  : { backgroundColor: '#f9f9f9', color: 'var(--bonnie-muted)', borderColor: 'transparent' }}>
                {type === 'food_support' ? t.foodSupport : t.foodTruck}
              </button>
            ))}
          </div>
        </div>

        {/* Food Support: multi-select categories */}
        {regType === 'food_support' && (
          <div className="p-4 rounded-2xl space-y-4" style={{ backgroundColor: 'var(--bonnie-warm)' }}>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--bonnie-muted)' }}>{t.catLabel} *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['savory','dessert','drink','fruit'] as FoodCat[]).map(cat => {
                  const icons = { savory:'🍱', dessert:'🍰', drink:'🧃', fruit:'🍎' }
                  const labels = { savory: t.savory, dessert: t.dessert, drink: t.drink, fruit: t.fruit }
                  const selected = foodCats.includes(cat)
                  return (
                    <button key={cat} onClick={() => toggleCat(cat)}
                      className="py-2.5 rounded-xl text-xs font-medium border-2 flex items-center justify-center gap-1.5 transition-all"
                      style={selected
                        ? { background: 'linear-gradient(135deg, var(--bonnie-lavender), var(--bonnie-rose))', color: 'white', borderColor: 'var(--bonnie-rose)' }
                        : { backgroundColor: 'white', color: 'var(--bonnie-muted)', borderColor: 'transparent' }}>
                      {selected && <span>✓</span>} {icons[cat]} {labels[cat]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity per selected category */}
            {foodCats.map(cat => {
              const icons = { savory:'🍱', dessert:'🍰', drink:'🧃', fruit:'🍎' }
              const labels = { savory: t.savory, dessert: t.dessert, drink: t.drink, fruit: t.fruit }
              return (
                <div key={cat}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--bonnie-muted)' }}>
                    {icons[cat]} {labels[cat]} — {t.qtyLabel} *
                  </label>
                  <input
                    value={quantities[cat]}
                    onChange={e => setQuantities(prev => ({ ...prev, [cat]: e.target.value }))}
                    placeholder={t.qtyPlaceholder}
                    className={inp} style={inpStyle} />
                </div>
              )
            })}
          </div>
        )}

        {/* Terms */}
        <div className="space-y-3">
          <div className="text-xs font-semibold" style={{ color: 'var(--bonnie-dark)' }}>{t.termsTitle}</div>
          <div className="p-4 rounded-2xl border" style={{ borderColor: '#E9D5FF', backgroundColor: 'var(--bonnie-cream)' }}>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--bonnie-dark)' }}>{t.cond1}</p>
            <div className="flex gap-2">
              <button onClick={() => setConvenience('convenient')}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                style={convenience === 'convenient' ? { borderColor: '#16a34a', backgroundColor: '#f0fdf4', color: '#16a34a' } : { borderColor: '#e5e7eb', backgroundColor: 'white', color: 'var(--bonnie-muted)' }}>
                ✓ {t.convenient}
              </button>
              <button onClick={() => setConvenience('not_convenient')}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                style={convenience === 'not_convenient' ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', color: '#dc2626' } : { borderColor: '#e5e7eb', backgroundColor: 'white', color: 'var(--bonnie-muted)' }}>
                ✗ {t.notConvenient}
              </button>
            </div>
          </div>
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-colors"
            style={{ borderColor: acceptedTerms ? 'var(--bonnie-rose)' : '#f3c6d0', backgroundColor: acceptedTerms ? 'var(--bonnie-warm)' : 'var(--bonnie-cream)' }}>
            <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-0.5 flex-shrink-0 w-4 h-4 accent-rose-400" />
            <span className="text-xs leading-relaxed" style={{ color: 'var(--bonnie-dark)' }}>{t.cond2}</span>
          </label>
        </div>

        {error && <div className="px-4 py-3 rounded-xl text-xs text-red-700 bg-red-50 border border-red-200">{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3.5 rounded-2xl text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--bonnie-lavender), var(--bonnie-rose))' }}>
          {loading ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  )
}
