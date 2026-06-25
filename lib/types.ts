export type FoodCategory = 'savory' | 'dessert' | 'drink' | 'fruit' | 'food_truck'
export type RegistrationType = 'food_support' | 'food_truck'
export type RegistrationStatus = 'pending' | 'sent' | 'unavailable' | 'contacting' | 'cancelled'
export type ConvenienceChoice = 'convenient' | 'not_convenient'

export interface Registration {
  id: string
  name: string
  account: string
  food_allergies: string
  registration_type: RegistrationType
  food_category?: FoodCategory
  food_quantity?: string
  convenience_choice: ConvenienceChoice
  accepted_terms: boolean
  status: RegistrationStatus
  queue_number: number
  created_at: string
  updated_at: string
}

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, { th: string; en: string }> = {
  savory: { th: 'อาหารคาว', en: 'Savory Food' },
  dessert: { th: 'ของหวาน', en: 'Dessert' },
  drink: { th: 'เครื่องดื่ม', en: 'Drinks' },
  fruit: { th: 'ผลไม้', en: 'Fruits' },
  food_truck: { th: 'Food Truck', en: 'Food Truck' },
}

export const STATUS_LABELS: Record<RegistrationStatus, { th: string; en: string }> = {
  pending: { th: 'รอดำเนินการ', en: 'Pending' },
  sent: { th: 'ส่งแล้ว', en: 'Sent' },
  unavailable: { th: 'ไม่สะดวกส่งในรอบ', en: 'Unavailable This Round' },
  contacting: { th: 'ระหว่างการติดต่อ', en: 'In Contact' },
  cancelled: { th: 'ยกเลิกคิว', en: 'Cancelled' },
}
