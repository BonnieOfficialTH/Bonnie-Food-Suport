-- ============================================================
-- Bonnie Food Support — Supabase SQL Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  account TEXT NOT NULL,
  food_allergies TEXT NOT NULL DEFAULT '',
  registration_type TEXT NOT NULL CHECK (registration_type IN ('food_support', 'food_truck')),
  food_category TEXT CHECK (food_category IN ('savory', 'dessert', 'drink', 'fruit', 'food_truck')),
  food_quantity TEXT,
  convenience_choice TEXT NOT NULL CHECK (convenience_choice IN ('convenient', 'not_convenient')),
  accepted_terms BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'unavailable', 'contacting', 'cancelled')),
  queue_number SERIAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- 3. Public can INSERT (register) and SELECT (view queue)
CREATE POLICY "Public can insert" ON registrations
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Public can view" ON registrations
  FOR SELECT TO anon
  USING (true);

-- 4. Only authenticated users (admins) can UPDATE
CREATE POLICY "Admin can update" ON registrations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE registrations;

-- 6. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- UPDATE v2: Settings table (for allergy notice)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings
CREATE POLICY "Public can read settings" ON settings
  FOR SELECT TO anon USING (true);

-- Only admin can write settings
CREATE POLICY "Admin can write settings" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default empty notice
INSERT INTO settings (key, value) VALUES ('allergy_notice', '') ON CONFLICT DO NOTHING;
