-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    comuna TEXT,
    equipment_type TEXT,
    installation_date TIMESTAMP,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    completed_date TIMESTAMP,
    notes TEXT,
    technician_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 10,
    location TEXT,
    last_restocked TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(equipment_type, location)
);

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    priority TEXT DEFAULT 'MEDIUM',
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_maintenances_scheduled_date ON maintenances(scheduled_date);
CREATE INDEX idx_maintenances_status ON maintenances(status);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, restrict later)
CREATE POLICY "Allow all access to clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all access to maintenances" ON maintenances FOR ALL USING (true);
CREATE POLICY "Allow all access to inventory" ON inventory FOR ALL USING (true);
CREATE POLICY "Allow all access to incidents" ON incidents FOR ALL USING (true);

-- Insert sample data (optional)
INSERT INTO inventory (equipment_type, quantity, min_stock, location) VALUES
    ('WHP-3200', 45, 10, 'Bodega Principal'),
    ('WHP-4200S Negro', 187, 20, 'Bodega Principal'),
    ('WHP-4200S Blanco', 23, 15, 'Bodega Principal'),
    ('Filtro Sedimento', 450, 100, 'Bodega Principal'),
    ('Filtro Carbón', 380, 100, 'Bodega Principal');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenances_updated_at BEFORE UPDATE ON maintenances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();