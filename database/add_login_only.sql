CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL CHECK (username ~ '^[A-Za-z0-9_.-]{3,50}$'),
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, full_name, password_hash) VALUES
('admin', 'HR Administrator', '$2b$10$klqYbALE1ojHj8BhxGYkZuSNhgFs3ezGPhWLJQyYjPRS3FrQNljje')
ON CONFLICT (username) DO NOTHING;
