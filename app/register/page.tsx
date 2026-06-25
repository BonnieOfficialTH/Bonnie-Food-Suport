'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/lang-context'
import Link from 'next/link'

type RegType = 'food_support' | 'food_truck'
type FoodCat = 'savory' | 'dessert' | 'drink' | 'fruit'

const tx = {
  th: {
    title: 'ลงทะเบียน',
    allergyNotice: '⚠️ อาหารที่ทางบ้านขอให้หลีกเลี่ยง',
    allergyEmpty: 'ไม่มีประกาศในขณะนี้',
    nameLabel: 'ชื่อ', namePlaceholder: 'ชื่อของท่าน',
    accountLabel: 'แอคเคาท์', accountPlaceholder: '@username หรือ Account ที่ใช้ติดต่อ',
    typeLabel: 'ต้องการส่งแบบ',
    foodSupport: 'Food Support', foodTruck: 'Food Truck',
    catLabel: 'ประเภทอาหาร',
    savory: 'อาหารคาว', dessert: 'ของหวาน', drink: 'เครื่องดื่ม', fruit: 'ผลไม้',
    qtyLabel: 'จำนวนของอาหาร', qtyPlaceholder: 'เช่น ข้าวมันไก่ 30 กล่อง',
    termsTitle: 'เงื่อนไขก่อนลงทะเบียน',
    cond1: 'กรณีที่เรียกคิวลงทะเบียนครบแล้ว และยังมีช่วงวันหรือเวลาว่างคงเหลือ ทางบ้านขออนุญาตติดต่อกลับเพื่อดำเนินการส่ง Food Support / Food Truck โดยเรียงตามหมวดหมู่ทันที ท่านสะดวกให้ดำเนินการในลักษณะนี้หรือไม่คะ?',
    convenient: 'สะดวก', notConvenient: 'ไม่สะดวก',
    cond2: 'ท่านได้อ่านกติกาของทางบ้านอย่างครบถ้วน และยอมรับเงื่อนไขทั้งหมดแล้วก่อนลงทะเบียน',
    submit: 'ส่งข้อมูล', submitting: 'กำลังส่ง...',
    successTitle: 'ลงทะเบียนสำเร็จ! 🌸', successMsg: 'ขอบคุณค่ะ ข้อมูลของท่านได้รับการบันทึกแล้ว',
    queueNum: 'หมายเลขคิวของท่าน', viewQueue: 'ดูคิวทั้งหมด', registerAnother: 'ลงทะเบียนใหม่',
    errRequired: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    errCond1: 'กรุณาเลือกว่าสะดวกหรือไม่สะดวก',
    errCond2: 'กรุณายอมรับเงื่อนไขของทางบ้านก่อน',
    errServer: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
  },
  en: {
    title: 'Register',
    allergyNotice: '⚠️ Foods the house requests to avoid',
    allergyEmpty: 'No announcements at this time',
    nameLabel: 'Name', namePlaceholder: 'Your name',
    accountLabel: 'Account', accountPlaceholder: '@username or contact account',
    typeLabel: 'Delivery Type',
    foodSupport: 'Food Support', foodTruck: 'Food Truck',
    catLabel: 'Food Category',
    savory: 'Savory Food', dessert: 'Dessert', drink: 'Drinks', fruit: 'Fruits',
    qtyLabel: 'Food Quantity', qtyPlaceholder: 'e.g. Chicken rice 30 boxes',
    termsTitle: 'Pre-registration Terms',
    cond1: 'If the registration queue is full but there are remaining time slots, may the team contact you to arrange delivery of Food Support / Food Truck ordered by category immediately?',
    convenient: 'Convenient', notConvenient: 'Not Convenient',
    cond2: 'I have read all house rules completely and accept all conditions before registering.',
    submit: 'Submit', submitting: 'Submitting...',
    successTitle: 'Registered Successfully! 🌸', successMsg: 'Thank you! Your information has been recorded.',
    queueNum: 'Your Queue Number', viewQueue: 'View All Queues', registerAnother: 'Register Again',
    errRequired: 'Please fill in all required fields.',
    errCond1: 'Please select convenient or not convenient.',
    errCond2: 'Please accept the house rules before submitting.',
    errServer: 'An error occurred. Please try again.',
  },
}

export default function RegisterPage() {
  const { lang } = useLang()
  const t = tx[lang]

  const [allergyNotice, setAllergyNotice] = useState('')
  const [name, setName] = useState('')
  const [account, setAccount] = useState('')
  const [regType, setRegType] = useState<RegType | ''>('')
  const [foodCat, setFoodCat] = useState<FoodCat | ''>('')
  const [quantity, setQuantity] = useState('')
  const [convenience, setConvenience] = useState<'convenient' | 'not_convenient' | ''>('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ queueNumber: number } | null>(null)

  const [foodLiked, setFoodLiked] = useState('')

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'allergy_notice').single()
      .then(({ data }) => { if (data?.value) setAllergyNotice(data.value) })
    supabase.from('settings').select('value').eq('key', 'food_liked').single()
      .then(({ data }) => { if (data?.value) setFoodLiked(data.value) })
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (!name || !account || !regType) { setError(t.errRequired); return }
    if (regType === 'food_support' && (!foodCat || !quantity)) { setError(t.errRequired); return }
    if (!convenience) { setError(t.errCond1); return }
    if (!acceptedTerms) { setError(t.errCond2); return }

    setLoading(true)
    try {
      const { data, error: err } = await supabase.from('registrations').insert([{
        name, account,
        food_allergies: '',
        registration_type: regType,
        food_category: regType === 'food_support' ? foodCat : 'food_truck',
        food_quantity: regType === 'food_support' ? quantity : null,
        convenience_choice: convenience,
        accepted_terms: acceptedTerms,
        status: 'pending',
      }]).select('queue_number').single()
      if (err) throw err
      setSuccess({ queueNumber: data.queue_number })
    } catch {
      setError(t.errServer)
    } finally {
      setLoading(false)
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm bg-white"
  const inpStyle = { borderColor: '#f3c6d0', color: 'var(--bonnie-dark)' }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🌸</div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>{t.successTitle}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--bonnie-muted)' }}>{t.successMsg}</p>
        <div className="rounded-2xl p-8 mb-6 mx-auto max-w-xs" style={{ backgroundColor: 'var(--bonnie-warm)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--bonnie-muted)' }}>{t.queueNum}</div>
          <div className="text-6xl font-bold" style={{ color: 'var(--bonnie-rose)', fontFamily: 'Georgia, serif' }}>#{success.queueNumber}</div>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/queue" className="px-5 py-2.5 rounded-full text-white text-sm"
            style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>{t.viewQueue}</Link>
          <button onClick={() => { setSuccess(null); setName(''); setAccount(''); setRegType(''); setFoodCat(''); setQuantity(''); setConvenience(''); setAcceptedTerms(false) }}
            className="px-5 py-2.5 rounded-full text-sm border"
            style={{ borderColor: 'var(--bonnie-pink)', color: 'var(--bonnie-rose)', backgroundColor: 'white' }}>{t.registerAnother}</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5" style={{ fontFamily: 'Georgia, serif', color: 'var(--bonnie-dark)' }}>{t.title}</h1>

      <div className="bg-white rounded-3xl p-5 md:p-7 border space-y-5" style={{ borderColor: '#f9dde5' }}>

        {/* Allergy notice from admin */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff7ed', border: '1.5px solid #fed7aa' }}>
          <div className="text-xs font-semibold mb-1.5" style={{ color: '#c2410c' }}>{t.allergyNotice}</div>
          <p className="text-sm leading-relaxed" style={{ color: allergyNotice ? '#7c2d12' : 'var(--bonnie-muted)' }}>
            {allergyNotice || t.allergyEmpty}
          </p>
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
              <button key={type} onClick={() => { setRegType(type); setFoodCat(''); setQuantity('') }}
                className="py-3 rounded-xl text-sm font-medium border-2 transition-all"
                style={regType === type
                  ? { background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))', color: 'white', borderColor: 'var(--bonnie-rose)' }
                  : { backgroundColor: '#f9f9f9', color: 'var(--bonnie-muted)', borderColor: 'transparent' }}>
                {type === 'food_support' ? t.foodSupport : t.foodTruck}
              </button>
            ))}
          </div>
        </div>

        {/* Food Support details */}
        {regType === 'food_support' && (
          <div className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: 'var(--bonnie-warm)' }}>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--bonnie-muted)' }}>{t.catLabel} *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['savory','dessert','drink','fruit'] as FoodCat[]).map(cat => {
                  const icons = { savory:'🍱', dessert:'🍰', drink:'🧃', fruit:'🍎' }
                  const labels = { savory: t.savory, dessert: t.dessert, drink: t.drink, fruit: t.fruit }
                  return (
                    <button key={cat} onClick={() => setFoodCat(cat)}
                      className="py-2.5 rounded-xl text-xs font-medium border-2 flex items-center justify-center gap-1.5 transition-all"
                      style={foodCat === cat
                        ? { background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))', color: 'white', borderColor: 'var(--bonnie-rose)' }
                        : { backgroundColor: 'white', color: 'var(--bonnie-muted)', borderColor: 'transparent' }}>
                      {icons[cat]} {labels[cat]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--bonnie-muted)' }}>{t.qtyLabel} *</label>
              <input value={quantity} onChange={e => setQuantity(e.target.value)} placeholder={t.qtyPlaceholder} className={inp} style={inpStyle} />
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="space-y-3">
          <div className="text-xs font-semibold" style={{ color: 'var(--bonnie-dark)' }}>{t.termsTitle}</div>

          <div className="p-4 rounded-2xl border" style={{ borderColor: '#f3c6d0', backgroundColor: 'var(--bonnie-cream)' }}>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--bonnie-dark)' }}>{t.cond1}</p>
            <div className="flex gap-2">
              <button onClick={() => setConvenience('convenient')}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                style={convenience === 'convenient'
                  ? { borderColor: '#16a34a', backgroundColor: '#f0fdf4', color: '#16a34a' }
                  : { borderColor: '#e5e7eb', backgroundColor: 'white', color: 'var(--bonnie-muted)' }}>
                ✓ {t.convenient}
              </button>
              <button onClick={() => setConvenience('not_convenient')}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                style={convenience === 'not_convenient'
                  ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', color: '#dc2626' }
                  : { borderColor: '#e5e7eb', backgroundColor: 'white', color: 'var(--bonnie-muted)' }}>
                ✗ {t.notConvenient}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-colors"
            style={{ borderColor: acceptedTerms ? 'var(--bonnie-rose)' : '#f3c6d0', backgroundColor: acceptedTerms ? 'var(--bonnie-warm)' : 'var(--bonnie-cream)' }}>
            <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 flex-shrink-0 w-4 h-4 accent-rose-400" />
            <span className="text-xs leading-relaxed" style={{ color: 'var(--bonnie-dark)' }}>{t.cond2}</span>
          </label>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-xs text-red-700 bg-red-50 border border-red-200">{error}</div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3.5 rounded-2xl text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--bonnie-pink), var(--bonnie-rose))' }}>
          {loading ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  )
}
