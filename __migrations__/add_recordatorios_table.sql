-- Tabla para almacenar los recordatorios
CREATE TABLE IF NOT EXISTS recordatorios (
    id SERIAL PRIMARY KEY,
    movimiento_id INTEGER REFERENCES movimientos(id) ON DELETE CASCADE,
    fecha_recordatorio TIMESTAMP NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
