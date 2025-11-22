-- Database initialization script for Customer Management System
-- This script creates the customers table and seeds it with initial data

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    employees INTEGER NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Create index on employees for size calculations
CREATE INDEX IF NOT EXISTS idx_customers_employees ON customers(employees);

-- Insert initial customer data (migrated from hardcoded backend data)
INSERT INTO customers (id, name, employees, contact_name, contact_email) VALUES
    (1, 'Americas Inc.', 100, 'John Smith', 'jsmith@americasinc.com'),
    (2, 'Caribian Airlnis', 1000, 'Jose Martinez', 'martines@cair.com'),
    (3, 'MacroSoft', 540, 'Bill Paxton', 'bp@ms.com'),
    (4, 'United Brands', 20, NULL, NULL),
    (5, 'Bananas Corp', 1001, 'Xavier Hernandez', 'xavier@bananas.com'),
    (6, 'XPTO.com', 101, 'Daniel Zuck', 'zuckh@xpto.com')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to continue from the last inserted ID
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

-- Grant necessary permissions (if using specific user)
-- GRANT ALL PRIVILEGES ON TABLE customers TO postgres;
-- GRANT USAGE, SELECT ON SEQUENCE customers_id_seq TO postgres;
