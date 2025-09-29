
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'readonly' CHECK (role IN ('admin', 'readonly')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$rOq7YPz8qXqYKX8YK8KxMe8QHqYxKzXBFjl6QjKzO8YPm6zBZzJHy', 'admin')
ON CONFLICT (username) DO NOTHING;