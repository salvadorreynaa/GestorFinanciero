-- Agregar columnas necesarias a recordatorios
ALTER TABLE recordatorios 
ADD COLUMN IF NOT EXISTS fecha_recordatorio TIMESTAMP,
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';
