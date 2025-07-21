import os
from flask import Flask, render_template, request, redirect, url_for
import psycopg2

app = Flask(__name__)

# Conexión a PostgreSQL usando variable de entorno DATABASE_URL
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

# Crear la tabla movimientos si no existe (esto se ejecuta siempre)
try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS movimientos (
            id SERIAL PRIMARY KEY,
            descripcion TEXT NOT NULL,
            monto NUMERIC NOT NULL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    conn.commit()
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error creando la tabla movimientos: {e}")

@app.route('/')
def index():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM movimientos ORDER BY fecha DESC;')
    movimientos = cur.fetchall()
    cur.close()
    conn.close()
    return render_template('index.html', movimientos=movimientos)

# Endpoint para estadísticas
@app.route('/estadisticas')
def estadisticas():
    return render_template('estadisticas.html')

# Endpoint para contactos
@app.route('/contactos')
def contactos():
    return render_template('contactos.html')

# Endpoint para movimientos
@app.route('/movimientos')
def movimientos():
    return render_template('movimientos.html')

@app.route('/agregar', methods=['POST'])
def agregar():
    descripcion = request.form['descripcion']
    monto = request.form['monto']
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO movimientos (descripcion, monto) VALUES (%s, %s);', (descripcion, monto))
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
