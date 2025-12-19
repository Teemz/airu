-- Initialize tariffs table
CREATE TABLE IF NOT EXISTS tariffs (
  tariff_id SERIAL PRIMARY KEY,
  tariff_name VARCHAR(255) NOT NULL,
  max_businesses INTEGER,
  features JSONB DEFAULT '{}'
);

-- Initialize users table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tariff_id INTEGER REFERENCES tariffs(tariff_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize businesses table
CREATE TABLE IF NOT EXISTS businesses (
  business_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize knowledge table
CREATE TABLE IF NOT EXISTS knowledge (
  knowledge_id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
  knowledge_title VARCHAR(255),
  content_type VARCHAR(50) DEFAULT 'text',
  file_path VARCHAR(500),
  chroma_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert tariffs
INSERT INTO tariffs (tariff_name, max_businesses, features) VALUES
('Стартап', 1, '{"file_upload": false}'),
('Основатель', 5, '{"file_upload": true}'),
('Холдинг', 15, '{"file_upload": true}'),
('Партнер', NULL, '{"file_upload": true}') ON CONFLICT DO NOTHING;

-- Insert test user: test@business / password
-- Password hash for 'password' using bcrypt with 10 rounds
INSERT INTO users (email, password_hash, tariff_id) VALUES
('test@business', '$2b$10$fvBaleG5fF3iCCfsRrkIAOw2BimOxTyVqr9oqqNraxfN64k43X/g6', 1) 
ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  tariff_id = EXCLUDED.tariff_id;

-- Create test business for test user
INSERT INTO businesses (user_id, business_name) 
SELECT user_id, 'Test Business' FROM users WHERE email = 'test@business'
ON CONFLICT DO NOTHING;