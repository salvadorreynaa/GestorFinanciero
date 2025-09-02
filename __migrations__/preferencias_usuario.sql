-- Tabla para almacenar preferencias de usuario
CREATE TABLE IF NOT EXISTS preferencias_usuario (
    user_id INTEGER PRIMARY KEY,
    notificaciones_activas BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
