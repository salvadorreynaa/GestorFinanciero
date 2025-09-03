-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario principal (vayavalla)
INSERT INTO usuarios (username, password_hash, rol)
VALUES (
    'vayavalla',
    'pbkdf2:sha256:600000$0ynPBMlAERJiK5NZ$9d1ff0f700b446e0f2ec9019e22874f825be44ee4926e6171623747e6af6105e',  -- hash de 'palayenti2512'
    'admin'
)
ON CONFLICT (username) DO NOTHING;

-- Insertar usuario restringido (registros)
INSERT INTO usuarios (username, password_hash, rol)
VALUES (
    'registros',
    'pbkdf2:sha256:600000$ePYE9YVgqrJIJmcQ$987c10f3af245c74d9b20751e7e13b6f729762d671a5bda5225b27251bde477e',  -- hash de '221885'
    'registro'
)
ON CONFLICT (username) DO NOTHING;

-- Para futuros usuarios, usar este formato (reemplazar username y password):
/*
INSERT INTO usuarios (username, password_hash, rol)
VALUES ('nuevo_usuario', 'hash_de_contraseña', 'registro')
ON CONFLICT (username) DO NOTHING;
*/
