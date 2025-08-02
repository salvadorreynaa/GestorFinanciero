-- Primero eliminamos la restricción única existente
ALTER TABLE tipos_movimiento DROP CONSTRAINT IF EXISTS tipos_movimiento_nombre_key;

-- Luego agregamos una nueva restricción única que considere tanto el nombre como el tipo
ALTER TABLE tipos_movimiento ADD CONSTRAINT tipos_movimiento_nombre_tipo_key UNIQUE (nombre, tipo);
