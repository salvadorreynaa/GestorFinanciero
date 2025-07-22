-- Script para crear la tabla movimientos en PostgreSQL
CREATE TABLE IF NOT EXISTS movimientos (
    id SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



aun no se ven las estadisticas en estadisticas xd, mira, no se mucho del tema pero sera que estadisticas se debe conectar a la base de datos para sacar los numero y ordenarlos, sumarlos o restarlos, sera??, puedes revisar??