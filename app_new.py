import os
from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from functools import wraps
import psycopg2
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
import time
from pywebpush import webpush, WebPushException

app = Flask(__name__)
app.secret_key = 'vayavalla2512'  # Clave secreta para las sesiones

# Configuraciones de seguridad para las sesiones
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 7200

# Configuración de notificaciones push
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', 'tu_clave_privada_aqui')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', 'tu_clave_publica_aqui')
VAPID_CLAIMS = {
    'sub': 'mailto:info@vayavalla.com'
}

# Variables globales
login_attempts = {}
ATTEMPT_LIMIT = 3
BLOCK_TIME = 900
push_subscriptions = {}

# Conexión a la base de datos
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

# Rutas para PWA
@app.route('/sw.js')
def service_worker():
    return app.send_file('sw.js', mimetype='application/javascript')

@app.route('/manifest.json')
def manifest():
    return app.send_file('static/manifest.json', mimetype='application/json')

# Rutas para recordatorios
@app.route('/api/recordatorios', methods=['POST'])
def crear_recordatorio():
    if not request.is_json:
        return jsonify({'error': 'Missing JSON'}), 400
    
    try:
        data = request.json
        movimiento_id = data.get('movimiento_id')
        activo = data.get('activo', True)

        if not movimiento_id:
            return jsonify({'error': 'Missing movimiento_id'}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Verificar si ya existe un recordatorio
        cur.execute("SELECT id, activo FROM recordatorios WHERE movimiento_id = %s", (movimiento_id,))
        recordatorio_existente = cur.fetchone()

        if recordatorio_existente:
            # Actualizar existente
            cur.execute("""
                UPDATE recordatorios 
                SET activo = %s, fecha_modificacion = CURRENT_TIMESTAMP 
                WHERE movimiento_id = %s
                RETURNING id
            """, (activo, movimiento_id))
        else:
            # Crear nuevo
            cur.execute("""
                INSERT INTO recordatorios (movimiento_id, activo) 
                VALUES (%s, %s) 
                RETURNING id
            """, (movimiento_id, activo))

        recordatorio_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({'id': recordatorio_id, 'activo': activo}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recordatorios/<int:movimiento_id>', methods=['GET'])
def obtener_recordatorio(movimiento_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id, activo FROM recordatorios WHERE movimiento_id = %s", (movimiento_id,))
        recordatorio = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if recordatorio:
            return jsonify({'id': recordatorio[0], 'activo': recordatorio[1]}), 200
        else:
            return jsonify({'activo': False}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recordatorios/<int:movimiento_id>', methods=['DELETE'])
def eliminar_recordatorio(movimiento_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("UPDATE recordatorios SET activo = false WHERE movimiento_id = %s", (movimiento_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rutas para notificaciones push
@app.route('/api/push-public-key')
def get_push_public_key():
    return jsonify({'publicKey': VAPID_PUBLIC_KEY})

@app.route('/api/push-subscription', methods=['POST'])
@login_required
def store_subscription():
    subscription = request.get_json()
    user_id = session.get('user_id', 'default')
    push_subscriptions[user_id] = subscription
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)
