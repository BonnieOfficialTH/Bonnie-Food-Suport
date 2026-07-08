-- ============================================================
-- V2: Multi-category queue system
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create queue_items table (one row per category per registration)
CREATE TABLE IF NOT EXISTS queue_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL,
  name TEXT NOT NULL,
  account TEXT NOT NULL,
  food_category TEXT NOT NULL CHECK (food_category IN ('savory', 'dessert', 'drink', 'fruit', 'food_truck')),
  food_quantity TEXT,
  registration_type TEXT NOT NULL,
  convenience_choice TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'unavailable', 'contacting', 'cancelled')),
  category_queue_number SERIAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. We need per-category queue numbers
-- Add category_queue_number sequences per category
CREATE SEQUENCE IF NOT EXISTS queue_savory_seq;
CREATE SEQUENCE IF NOT EXISTS queue_dessert_seq;
CREATE SEQUENCE IF NOT EXISTS queue_drink_seq;
CREATE SEQUENCE IF NOT EXISTS queue_fruit_seq;
CREATE SEQUENCE IF NOT EXISTS queue_food_truck_seq;

-- Drop the serial default and use category-specific sequences
ALTER TABLE queue_items ALTER COLUMN category_queue_number DROP DEFAULT;

-- 3. Function to get next queue number per category
CREATE OR REPLACE FUNCTION get_next_category_queue(cat TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE cat
    WHEN 'savory'     THEN RETURN nextval('queue_savory_seq');
    WHEN 'dessert'    THEN RETURN nextval('queue_dessert_seq');
    WHEN 'drink'      THEN RETURN nextval('queue_drink_seq');
    WHEN 'fruit'      THEN RETURN nextval('queue_fruit_seq');
    WHEN 'food_truck' THEN RETURN nextval('queue_food_truck_seq');
    ELSE RETURN 1;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 4. Enable RLS
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert queue_items" ON queue_items
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can view queue_items" ON queue_items
  FOR SELECT TO anon USING (true);

CREATE POLICY "Admin can update queue_items" ON queue_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 5. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE queue_items;

-- 6. Auto-update updated_at
CREATE TRIGGER set_queue_items_updated_at
  BEFORE UPDATE ON queue_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
