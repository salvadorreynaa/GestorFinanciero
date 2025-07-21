-- Script para crear la tabla movimientos en PostgreSQL
CREATE TABLE IF NOT EXISTS movimientos (
    id SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
