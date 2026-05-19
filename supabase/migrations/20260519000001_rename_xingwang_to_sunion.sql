-- Rename pet Xingwang → Sunion in all existing rows
UPDATE pets SET name = 'Sunion' WHERE name = 'Xingwang';

-- Update the signup trigger function so new users get 'Sunion'
CREATE OR REPLACE FUNCTION create_pets_for_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO pets (owner_id, name) VALUES
    (NEW.id, 'Sunion'),
    (NEW.id, 'Lily'),
    (NEW.id, 'Fluff'),
    (NEW.id, 'Stay');
  RETURN NEW;
END;
$$;
