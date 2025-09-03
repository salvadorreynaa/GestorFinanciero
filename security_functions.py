from flask import session, request, redirect, url_for, jsonify
from functools import wraps
# security_functions.py
import os
import hashlib
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash

def get_db_connection():
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if not DATABASE_URL:
        # Configuración local
        return psycopg2.connect(
            host="localhost",
            database="finanzas",
            user="postgres",
            password="postgres"
        )
    # Configuración de producción
    return psycopg2.connect(DATABASE_URL)
from datetime import datetime, timedelta
import time

# Constantes de seguridad
BLOCK_TIME = 300  # 5 minutos de bloqueo
ATTEMPT_LIMIT = 3  # Número máximo de intentos permitidos

# Diccionario para almacenar los intentos de inicio de sesión
login_attempts = {}

# Función para verificar credenciales
def verify_credentials(username, password):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT id, password_hash, rol FROM usuarios WHERE username = %s", (username,))
        user = cur.fetchone()
        
        if user and check_password_hash(user[1], password):
            return {
                'id': user[0],
                'username': username,
                'rol': user[2]
            }
        return None
    except Exception as e:
        print("Error verificando credenciales:", str(e))
        return None
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass
        print("Error verificando credenciales:", e)
        return None

# Decorador para proteger rutas
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        
        if session.get('ip') != request.remote_addr:
            session.clear()
            return redirect(url_for('login'))
        
        if time.time() - session.get('last_activity', 0) > 1800:  # 30 minutos
            session.clear()
            return redirect(url_for('login'))
        
        session['last_activity'] = time.time()
        return f(*args, **kwargs)
    return decorated_function

# Decorador para proteger rutas API
def api_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return decorated_function

def check_login_attempts(ip):
    if ip in login_attempts:
        attempts, last_attempt = login_attempts[ip]
        if datetime.now() - last_attempt > timedelta(seconds=BLOCK_TIME):
            login_attempts[ip] = (0, datetime.now())
            return True
        if attempts >= ATTEMPT_LIMIT:
            time_left = BLOCK_TIME - (datetime.now() - last_attempt).seconds
            if time_left > 0:
                return False
            login_attempts[ip] = (0, datetime.now())
    return True

def record_failed_attempt(ip):
    if ip in login_attempts:
        attempts, _ = login_attempts[ip]
        login_attempts[ip] = (attempts + 1, datetime.now())
    else:
        login_attempts[ip] = (1, datetime.now())
