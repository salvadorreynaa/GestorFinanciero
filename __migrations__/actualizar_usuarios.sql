-- Actualizar usuario principal (vayavalla)
UPDATE usuarios 
SET password_hash = 'pbkdf2:sha256:600000$uvRG6kN3ZL8F$06b6f87de273f35e195558edf3122dd8525c4361e505aa0e711ce4591a6465bc'  -- hash de 'palayenti2512'
WHERE username = 'vayavalla';

-- Actualizar usuario restringido (registros)
UPDATE usuarios 
SET password_hash = 'pbkdf2:sha256:600000$YZj9kpM2Dl4B$f89f44b146e95b0a87939f7670e427c9e707c8c51732c27cd3aa8a90c04643d8'  -- hash de '221885'
WHERE username = 'registros';
