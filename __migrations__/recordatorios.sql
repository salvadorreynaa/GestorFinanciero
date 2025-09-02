-- Crear tabla de recordatorios
CREATE TABLE IF NOT EXISTS recordatorios (
    id SERIAL PRIMARY KEY,
    movimiento_id INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movimiento_id) REFERENCES movimientos(id) ON DELETE CASCADE
);
