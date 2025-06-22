-- Initialize the database with sample data
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO items (name, description) VALUES 
    ('Sample Item 1', 'This is a sample item for testing'),
    ('Sample Item 2', 'Another sample item with different description'),
    ('Sample Item 3', 'Third sample item to populate the database')
ON CONFLICT DO NOTHING; 