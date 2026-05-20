-- Task icon: emoji character or built-in SVG id
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS icon_type text CHECK (icon_type IS NULL OR icon_type IN ('emoji', 'svg')),
  ADD COLUMN IF NOT EXISTS icon_value text;
